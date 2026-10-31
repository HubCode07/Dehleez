import express from "express";
import { config, missingConfiguration } from "./config.js";
import { initializeDatabase, pool, requirePool } from "./database.js";
import { finishSwiggyAuthorization, requestAppOrigin, startSwiggyAuthorization } from "./auth.js";
import { postChat } from "./chat.js";
import { existingSession } from "./session.js";
import { decryptTokens } from "./token-vault.js";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_request, response) => response.json({ ok: true }));

app.get("/api/session", async (request, response, next) => {
  try {
    if (!pool) return response.status(503).json({ ready: false, connected: false, missing: missingConfiguration() });
    const { ensureSession } = await import("./session.js");
    const session = await ensureSession(request, response);
    const db = requirePool();
    const result = await db.query<{ swiggy_tokens: string | null }>("SELECT swiggy_tokens FROM device_sessions WHERE id_hash = $1", [session.sessionHash]);
    response.json({ ready: true, connected: Boolean(result.rows[0]?.swiggy_tokens), missing: missingConfiguration() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/swiggy/start", async (request, response, next) => {
  try {
    response.json({ url: await startSwiggyAuthorization(request, response) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/swiggy/callback", async (request, response) => {
  try {
    const result = await finishSwiggyAuthorization(request, response);
    if (result.connected) return response.redirect(`${result.origin}/?connected=1`);
    return response.redirect(`${result.origin}/?connect_error=${encodeURIComponent(result.error ?? "Swiggy could not connect.")}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Swiggy could not be connected.";
    response.redirect(`${requestAppOrigin(request)}/?connect_error=${encodeURIComponent(message)}`);
  }
});

app.post("/api/auth/swiggy/disconnect", async (request, response, next) => {
  try {
    const session = await existingSession(request);
    if (session) {
      const db = requirePool();
      const result = await db.query<{ swiggy_tokens: string | null }>("SELECT swiggy_tokens FROM device_sessions WHERE id_hash = $1", [session.sessionHash]);
      const encrypted = result.rows[0]?.swiggy_tokens;
      if (encrypted) {
        const tokens = decryptTokens(encrypted);
        await fetch("https://mcp.swiggy.com/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${tokens.accessToken}` } }).catch(() => undefined);
        await db.query("UPDATE device_sessions SET swiggy_tokens = NULL WHERE id_hash = $1", [session.sessionHash]);
      }
    }
    response.json({ connected: false });
  } catch (error) {
    next(error);
  }
});

app.post("/api/chat", postChat);

app.use((error: unknown, _request: express.Request, response: express.Response, next: express.NextFunction) => {
  if (response.headersSent) return next(error);
  const message = error instanceof Error ? error.message : "The request could not be completed.";
  if (/Swiggy connection|authorization|GEMINI_API_KEY|TOKEN_ENCRYPTION_KEY/i.test(message)) {
    return response.status(503).json({ error: message });
  }
  console.error("[Dehleez API] Request failed", error instanceof Error ? error.name : "UnknownError");
  return response.status(500).json({ error: "Something went wrong. Please try again." });
});

async function start() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error("[Dehleez API] Local database initialization failed.", error instanceof Error ? error.message : "database error");
  }
  app.listen(config.port, () => console.info(`[Dehleez API] Listening on port ${config.port}`));
}

void start();
