import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 8787),
  databasePath: process.env.DEHLEEZ_DB_PATH,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY,
  appOrigin: process.env.APP_ORIGIN ?? "http://localhost:5173",
  production: process.env.NODE_ENV === "production",
};

export function missingConfiguration() {
  return [
    !config.geminiApiKey && "GEMINI_API_KEY",
  ].filter((value): value is string => Boolean(value));
}
