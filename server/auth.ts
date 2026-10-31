import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { config } from "./config.js";
import { requirePool } from "./database.js";
import { ensureSession, hashValue } from "./session.js";
import { encryptTokens } from "./token-vault.js";

export function pkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function requestAppOrigin(request: Request) {
  const configured = new URL(config.appOrigin).origin;
  if (config.production) return configured;

  const requestOrigin = request.get("origin");
  if (requestOrigin) {
    try {
      const parsed = new URL(requestOrigin);
      if (parsed.protocol === "http:" && isLocalHost(parsed.hostname)) return parsed.origin;
    } catch {
      // Invalid Origin headers fall back to the configured local app origin.
    }
  }

  const host = request.get("host");
  if (host) {
    try {
      const parsed = new URL(`http://${host}`);
      if (isLocalHost(parsed.hostname)) return parsed.origin;
    } catch {
      // Invalid Host headers fall back to the configured local app origin.
    }
  }
  return configured;
}

async function registerClient(redirectUri: string) {
  const response = await fetch("https://mcp.swiggy.com/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Dehleez",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: "mcp:tools mcp:resources mcp:prompts",
    }),
  });
  if (!response.ok) throw new Error("Swiggy could not register this app. Check that the callback URL is allowlisted.");
  const result = (await response.json()) as { client_id?: string };
  if (!result.client_id) throw new Error("Swiggy did not return an OAuth client ID.");
  return result.client_id;
}

export async function startSwiggyAuthorization(request: Request, response: Response) {
  const db = requirePool();
  const session = await ensureSession(request, response);
  const appOrigin = requestAppOrigin(request);
  const redirectUri = `${appOrigin}/api/auth/swiggy/callback`;
  const [{ verifier, challenge }, clientId] = await Promise.all([Promise.resolve(pkcePair()), registerClient(redirectUri)]);
  const state = randomBytes(32).toString("base64url");
  await db.query("DELETE FROM oauth_pending WHERE created_at < datetime('now', '-15 minutes')");
  await db.query(
    "INSERT INTO oauth_pending (state_hash, session_hash, code_verifier, client_id, redirect_uri, app_origin) VALUES ($1, $2, $3, $4, $5, $6)",
    [hashValue(state), session.sessionHash, verifier, clientId, redirectUri, appOrigin],
  );
  const url = new URL("https://mcp.swiggy.com/auth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "mcp:tools mcp:resources mcp:prompts");
  return url.toString();
}

export async function finishSwiggyAuthorization(request: Request, response: Response) {
  const db = requirePool();
  const code = typeof request.query.code === "string" ? request.query.code : "";
  const state = typeof request.query.state === "string" ? request.query.state : "";
  if (!state) return { origin: requestAppOrigin(request), connected: false, error: "Swiggy authorization returned without a state. Please connect again." };
  const session = await ensureSession(request, response);
  const pending = await db.query<{ session_hash: string; code_verifier: string; client_id: string; redirect_uri: string; app_origin: string }>(
    "DELETE FROM oauth_pending WHERE state_hash = $1 AND session_hash = $2 AND created_at > datetime('now', '-15 minutes') RETURNING session_hash, code_verifier, client_id, redirect_uri, app_origin",
    [hashValue(state), session.sessionHash],
  );
  if (!pending.rowCount) return { origin: requestAppOrigin(request), connected: false, error: "This Swiggy authorization link expired. Please connect again." };

  const origin = pending.rows[0].app_origin || config.appOrigin;
  const redirectUri = pending.rows[0].redirect_uri || `${origin.replace(/\/$/, "")}/api/auth/swiggy/callback`;
  const oauthError = typeof request.query.error_description === "string"
    ? request.query.error_description
    : typeof request.query.error === "string"
      ? "Swiggy authorization was cancelled."
      : "";
  if (oauthError || !code) return { origin, connected: false, error: oauthError || "Swiggy authorization returned without a code. Please connect again." };
  const tokenResponse = await fetch("https://mcp.swiggy.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: pending.rows[0].client_id,
      code,
      code_verifier: pending.rows[0].code_verifier,
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenResponse.ok) return { origin, connected: false, error: "Swiggy could not complete the connection. Please try again." };
  const tokens = (await tokenResponse.json()) as { access_token: string; refresh_token: string; expires_in: number };
  const saved = await db.query("UPDATE device_sessions SET swiggy_tokens = $2 WHERE id_hash = $1", [
    session.sessionHash,
    encryptTokens({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresAt: Date.now() + tokens.expires_in * 1000 }),
  ]);
  if (!saved.rowCount) return { origin, connected: false, error: "Swiggy authorized, but this device session could not save the connection. Please reconnect." };
  return { origin, connected: true };
}
