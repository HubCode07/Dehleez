import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config.js";
import { dataDirectory } from "./database.js";

function encryptionKey() {
  let configuredKey = config.tokenEncryptionKey;
  if (!configuredKey) {
    const keyPath = join(dataDirectory, "token-encryption.key");
    try {
      configuredKey = readFileSync(keyPath, "utf8").trim();
    } catch {
      const generatedKey = randomBytes(32).toString("base64");
      try {
        writeFileSync(keyPath, generatedKey, { flag: "wx", mode: 0o600 });
        configuredKey = generatedKey;
      } catch {
        configuredKey = readFileSync(keyPath, "utf8").trim();
      }
    }
  }
  const key = Buffer.from(configuredKey, "base64");
  if (key.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return key;
}

export interface SwiggyTokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function encryptTokens(tokens: SwiggyTokenSet) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(tokens), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

export function decryptTokens(encrypted: string): SwiggyTokenSet {
  const value = Buffer.from(encrypted, "base64url");
  if (value.length < 29) throw new Error("Stored Swiggy authorization is invalid.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), value.subarray(0, 12));
  decipher.setAuthTag(value.subarray(12, 28));
  const clear = Buffer.concat([decipher.update(value.subarray(28)), decipher.final()]).toString("utf8");
  return JSON.parse(clear) as SwiggyTokenSet;
}
