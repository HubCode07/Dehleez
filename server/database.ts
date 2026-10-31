import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configuredPath = config.databasePath ?? "data/dehleez.sqlite";
const databasePath = isAbsolute(configuredPath) ? configuredPath : resolve(projectDirectory, configuredPath);
export const dataDirectory = dirname(databasePath);
mkdirSync(dataDirectory, { recursive: true });

const connection = new DatabaseSync(databasePath);
connection.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

type QueryResult<T> = { rows: T[]; rowCount: number };

const database = {
  async query<T = Record<string, unknown>>(sql: string, values: unknown[] = []): Promise<QueryResult<T>> {
    // Preserve PostgreSQL-style placeholder numbers. UPDATE statements often
    // mention $2 before $1, so rewriting them to positional `?` changes which
    // value is written to each column (including encrypted Swiggy tokens).
    const statement = connection.prepare(sql.replace(/\$(\d+)/g, ":p$1"));
    const parameters = Object.fromEntries(values.map((value, index) => [`:p${index + 1}`, value as SQLInputValue]));
    if (/^\s*(SELECT|UPDATE[\s\S]*\bRETURNING\b|DELETE[\s\S]*\bRETURNING\b)/i.test(sql)) {
      const rows = statement.all(parameters) as T[];
      return { rows, rowCount: rows.length };
    }
    const result = statement.run(parameters);
    return { rows: [], rowCount: Number(result.changes) };
  },
};

export const pool = database;

export async function initializeDatabase() {
  connection.exec(`
    CREATE TABLE IF NOT EXISTS device_sessions (
      id_hash TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      swiggy_tokens TEXT
    );
    CREATE TABLE IF NOT EXISTS oauth_pending (
      state_hash TEXT PRIMARY KEY,
      session_hash TEXT NOT NULL REFERENCES device_sessions(id_hash) ON DELETE CASCADE,
      code_verifier TEXT NOT NULL,
      client_id TEXT NOT NULL,
      redirect_uri TEXT NOT NULL DEFAULT '',
      app_origin TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_hash TEXT NOT NULL REFERENCES device_sessions(id_hash) ON DELETE CASCADE,
      vertical TEXT NOT NULL,
      conversation_id TEXT NOT NULL DEFAULT 'legacy',
      role TEXT NOT NULL CHECK (role IN ('user', 'model')),
      parts TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS device_sessions_expiry_idx ON device_sessions(expires_at);
  `);
  const chatColumns = new Set(connection.prepare("PRAGMA table_info(chat_messages)").all().map((column) => (column as { name: string }).name));
  if (!chatColumns.has("conversation_id")) connection.exec("ALTER TABLE chat_messages ADD COLUMN conversation_id TEXT NOT NULL DEFAULT 'legacy'");
  connection.exec("CREATE INDEX IF NOT EXISTS chat_messages_conversation_idx ON chat_messages(session_hash, vertical, conversation_id, id DESC)");
  const pendingColumns = new Set(connection.prepare("PRAGMA table_info(oauth_pending)").all().map((column) => (column as { name: string }).name));
  if (!pendingColumns.has("redirect_uri")) connection.exec("ALTER TABLE oauth_pending ADD COLUMN redirect_uri TEXT NOT NULL DEFAULT ''");
  if (!pendingColumns.has("app_origin")) connection.exec("ALTER TABLE oauth_pending ADD COLUMN app_origin TEXT NOT NULL DEFAULT ''");
}

export function requirePool() {
  return pool;
}
