import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { requirePool } from "./database.js";
import { config } from "./config.js";

const COOKIE_NAME = "dehleez_device";
const SESSION_TTL_DAYS = 30;

export function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function readCookie(request: Request) {
  const header = request.headers.cookie ?? "";
  const value = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return value ? decodeURIComponent(value.slice(COOKIE_NAME.length + 1)) : null;
}

function writeCookie(response: Response, value: string) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${SESSION_TTL_DAYS * 24 * 60 * 60}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (config.production) parts.push("Secure");
  response.setHeader("Set-Cookie", parts.join("; "));
}

export async function ensureSession(request: Request, response: Response) {
  const db = requirePool();
  let rawSession = readCookie(request);
  if (!rawSession || rawSession.length < 40) rawSession = null;

  if (rawSession) {
    const sessionHash = hashValue(rawSession);
    const found = await db.query<{ id_hash: string }>(
      "UPDATE device_sessions SET last_seen_at = CURRENT_TIMESTAMP, expires_at = datetime('now', '+30 days') WHERE id_hash = $1 AND expires_at > CURRENT_TIMESTAMP RETURNING id_hash",
      [sessionHash],
    );
    if (found.rowCount) return { rawSession, sessionHash };
  }

  rawSession = randomBytes(32).toString("base64url");
  const sessionHash = hashValue(rawSession);
  await db.query(
    "INSERT INTO device_sessions (id_hash, expires_at) VALUES ($1, datetime('now', '+30 days'))",
    [sessionHash],
  );
  writeCookie(response, rawSession);
  return { rawSession, sessionHash };
}

export async function existingSession(request: Request) {
  const db = requirePool();
  const rawSession = readCookie(request);
  if (!rawSession || rawSession.length < 40) return null;
  const sessionHash = hashValue(rawSession);
  const found = await db.query<{ id_hash: string }>(
    "UPDATE device_sessions SET last_seen_at = CURRENT_TIMESTAMP, expires_at = datetime('now', '+30 days') WHERE id_hash = $1 AND expires_at > CURRENT_TIMESTAMP RETURNING id_hash",
    [sessionHash],
  );
  return found.rowCount ? { rawSession, sessionHash } : null;
}

export function clearSessionCookie(response: Response) {
  const secure = config.production ? "; Secure" : "";
  response.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`);
}
