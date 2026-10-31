import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { requirePool } from "./database.js";
import { ensureSession, existingSession } from "./session.js";
import { decryptTokens, encryptTokens, type SwiggyTokenSet } from "./token-vault.js";

export const servers = {
  food: "https://mcp.swiggy.com/food",
  instamart: "https://mcp.swiggy.com/im",
  dineout: "https://mcp.swiggy.com/dineout",
  scenes: "https://mcp.swiggy.com/scenes",
} as const;

export type ServerId = keyof typeof servers;

function retryableMcpError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const value = error as { code?: unknown; status?: unknown; statusCode?: unknown; message?: unknown };
  const code = value.code;
  if (code === -32001 || code === -32003) return false;
  if (code === -32000) return true;
  const status = Number(value.status ?? value.statusCode);
  if (status === 401 || status === 403 || (status >= 400 && status < 500 && status !== 429)) return false;
  if (status === 429 || (status >= 500 && status < 600)) return true;
  return typeof value.message === "string" && /timeout|temporar|network|fetch failed|socket hang up/i.test(value.message);
}

function retryAfterMs(error: unknown) {
  if (!error || typeof error !== "object") return 0;
  const value = error as { retryAfter?: unknown; retry_after?: unknown; headers?: Headers; response?: { headers?: Headers }; message?: unknown };
  const raw = value.retryAfter ?? value.retry_after ?? value.response?.headers?.get("Retry-After") ?? value.headers?.get("Retry-After");
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds * 1000, 30_000);
  if (typeof value.message === "string") {
    const match = value.message.match(/retry[- ]after\s*[:=]?\s*(\d+)/i);
    if (match) return Math.min(Number(match[1]) * 1000, 30_000);
  }
  return 0;
}

async function retryRead<T>(operation: () => Promise<T>): Promise<T> {
  const start = Date.now();
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!retryableMcpError(error) || attempt >= 3 || Date.now() - start >= 30_000) throw error;
      const delay = retryAfterMs(error) || Math.min(500 * 2 ** attempt + Math.random() * (500 * 2 ** attempt * 0.3), 8_000);
      if (Date.now() + delay - start > 30_000) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function refreshTokens(tokens: SwiggyTokenSet): Promise<SwiggyTokenSet> {
  const response = await fetch("https://mcp.swiggy.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "refresh_token", refresh_token: tokens.refreshToken }),
  });
  if (!response.ok) throw new Error("Your Swiggy connection has expired. Please connect Swiggy again.");
  const value = (await response.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: value.access_token,
    refreshToken: value.refresh_token,
    expiresAt: Date.now() + value.expires_in * 1000,
  };
}

type SwiggySession = { sessionHash: string; tokens: SwiggyTokenSet };

function isAuthenticationFailure(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const value = error as { status?: unknown; statusCode?: unknown; code?: unknown; body?: { error?: { code?: unknown } }; message?: unknown };
  return value.status === 401 || value.statusCode === 401 || value.code === -32001 || value.body?.error?.code === -32001
    || (typeof value.message === "string" && /\b401\b|-32001|unauthorized|invalid bearer token/i.test(value.message));
}

async function persistRefreshedTokens(sessionHash: string, current: SwiggyTokenSet) {
  try {
    const next = await refreshTokens(current);
    await requirePool().query("UPDATE device_sessions SET swiggy_tokens = $2 WHERE id_hash = $1", [sessionHash, encryptTokens(next)]);
    return next;
  } catch (error) {
    await requirePool().query("UPDATE device_sessions SET swiggy_tokens = NULL WHERE id_hash = $1", [sessionHash]);
    throw error instanceof Error ? error : new Error("Your Swiggy connection has expired. Please connect Swiggy again.");
  }
}

export async function getSwiggyTokens(request: Parameters<typeof existingSession>[0], response?: Parameters<typeof ensureSession>[1]) {
  const session = response ? await ensureSession(request, response) : await existingSession(request);
  if (!session) return null;
  const db = requirePool();
  const result = await db.query<{ swiggy_tokens: string | null }>(
    "SELECT swiggy_tokens FROM device_sessions WHERE id_hash = $1 AND expires_at > CURRENT_TIMESTAMP",
    [session.sessionHash],
  );
  if (!result.rows[0]?.swiggy_tokens) return null;
  let tokens = decryptTokens(result.rows[0].swiggy_tokens);
  if (tokens.expiresAt <= Date.now() + 60_000) {
    tokens = await persistRefreshedTokens(session.sessionHash, tokens);
  }
  return { ...session, tokens };
}

export async function revokeSwiggyTokens(tokens: SwiggyTokenSet) {
  await fetch("https://mcp.swiggy.com/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  }).catch(() => undefined);
}

async function withSingleSwiggyClient<T>(server: ServerId, session: SwiggySession, callback: (client: Client) => Promise<T>): Promise<T> {
  let tokens = session.tokens;
  const createClient = (accessToken: string) => {
    const transport = new StreamableHTTPClientTransport(new URL(servers[server]), {
      requestInit: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const client = new Client({ name: "dehleez", version: "1.0.0" }, { capabilities: {} });
    return { client, transport };
  };
  let { client, transport } = createClient(tokens.accessToken);
  try {
    try {
      await client.connect(transport);
    } catch (error) {
      if (!isAuthenticationFailure(error)) throw error;
      await client.close().catch(() => undefined);
      tokens = await persistRefreshedTokens(session.sessionHash, tokens);
      ({ client, transport } = createClient(tokens.accessToken));
      await client.connect(transport);
    }

    const authenticatedClient = new Proxy(client, {
      get(_target, property) {
        const current = client;
        const member = Reflect.get(current, property, current) as unknown;
        if (typeof member !== "function") return member;
        return async (...args: unknown[]) => {
          try {
            const invoke = () => Reflect.apply(member, current, args) as Promise<unknown>;
            if ((property === "listTools" || property === "readResource" || property === "listResources") && typeof args[0] === "object") {
              return await retryRead(invoke);
            }
            if (property === "callTool" && typeof args[0] === "object") {
              const toolName = (args[0] as { name?: unknown }).name;
              const idempotent = typeof toolName === "string" && !new Set(["place_food_order", "checkout", "book_table", "place_event_order", "cancel_booking", "create_address", "delete_address", "report_error"]).has(toolName);
              return idempotent ? await retryRead(invoke) : await invoke();
            }
            return await invoke();
          } catch (error) {
            if (!isAuthenticationFailure(error)) throw error;
            tokens = await persistRefreshedTokens(session.sessionHash, tokens);
            await current.close().catch(() => undefined);
            ({ client, transport } = createClient(tokens.accessToken));
            await client.connect(transport);
            const refreshedMethod = Reflect.get(client, property, client);
            return typeof refreshedMethod === "function" ? Reflect.apply(refreshedMethod, client, args) : refreshedMethod;
          }
        };
      },
    });
    return await callback(authenticatedClient);
  } finally {
    await client.close().catch(() => undefined);
  }
}

export async function withSwiggyClient<T>(server: ServerId | ServerId[], session: SwiggySession, callback: (client: Client, clients?: Partial<Record<ServerId, Client>>) => Promise<T>): Promise<T> {
  if (!Array.isArray(server)) return withSingleSwiggyClient(server, session, callback);
  const clients: Partial<Record<ServerId, Client>> = {};
  const connectNext = async (index: number): Promise<T> => {
    const currentServer = server[index];
    if (!currentServer) return callback(clients[server[0]]!, clients);
    return withSingleSwiggyClient(currentServer, session, async (client) => {
      clients[currentServer] = client;
      return index + 1 < server.length ? connectNext(index + 1) : callback(clients[server[0]]!, clients);
    });
  };
  return connectNext(0);
}

export function configuredForSwiggy() {
  return true;
}
