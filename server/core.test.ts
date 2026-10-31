import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Request, Response } from "express";

process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 11).toString("base64");
process.env.DEHLEEZ_DB_PATH = join(tmpdir(), `dehleez-test-${randomUUID()}.sqlite`);
process.env.GEMINI_API_KEY = "test-only";

const { decryptTokens, encryptTokens } = await import("./token-vault.js");
const { initializeDatabase, requirePool } = await import("./database.js");
const { finishSwiggyAuthorization, pkcePair, startSwiggyAuthorization } = await import("./auth.js");
const { canInvokeFinalAction, cardFromTool, shouldStoreConversationTurn } = await import("./chat.js");
const { servers } = await import("./swiggy.js");

describe("Swiggy connection security", () => {
  it("creates a host-local SQLite store for persistent device sessions", async () => {
    await initializeDatabase();
    const db = requirePool();
    await db.query("INSERT INTO device_sessions (id_hash, expires_at) VALUES ($1, datetime('now', '+30 days'))", ["local-session"]);
    const result = await db.query<{ id_hash: string }>("SELECT id_hash FROM device_sessions WHERE id_hash = $1", ["local-session"]);
    expect(result.rows[0]?.id_hash).toBe("local-session");
  });

  it("encrypts and decrypts the rotating Swiggy token pair", () => {
    const tokens = { accessToken: "access-token", refreshToken: "refresh-token", expiresAt: 1_800_000_000_000 };
    expect(decryptTokens(encryptTokens(tokens))).toEqual(tokens);
  });

  it("rejects a modified encrypted token payload", () => {
    const encrypted = encryptTokens({ accessToken: "access", refreshToken: "refresh", expiresAt: Date.now() + 60_000 });
    const bytes = Buffer.from(encrypted, "base64url");
    bytes[bytes.length - 1] ^= 1;
    expect(() => decryptTokens(bytes.toString("base64url"))).toThrow();
  });

  it("creates PKCE verifier and S256 challenge values", async () => {
    const { createHash } = await import("node:crypto");
    const { verifier, challenge } = pkcePair();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(challenge).toBe(createHash("sha256").update(verifier).digest("base64url"));
  });

  it("returns to the same local app origin used to start Swiggy OAuth", async () => {
    const originalFetch = globalThis.fetch;
    let cookieHeader = "";
    let tokenRequest: Record<string, string> | undefined;
    globalThis.fetch = (async (input, init) => {
      if (String(input).endsWith("/auth/register")) {
        return new Response(JSON.stringify({ client_id: "test-client" }), { status: 201 });
      }
      tokenRequest = JSON.parse(String(init?.body)) as Record<string, string>;
      return new Response(JSON.stringify({ access_token: "access", refresh_token: "refresh", expires_in: 3600 }), { status: 200 });
    }) as typeof fetch;

    try {
      const makeRequest = (cookie = "", query: Record<string, string> = {}) => ({
        headers: { cookie },
        query,
        get: (name: string) => name.toLowerCase() === "origin" ? "http://localhost:5174" : name.toLowerCase() === "host" ? "localhost:5174" : undefined,
      }) as unknown as Request;
      const response = { setHeader: (_name: string, value: string) => { cookieHeader = value; } } as unknown as Response;
      const authorizationUrl = new URL(await startSwiggyAuthorization(makeRequest(), response));
      const expectedCallback = "http://localhost:5174/api/auth/swiggy/callback";
      expect(authorizationUrl.searchParams.get("redirect_uri")).toBe(expectedCallback);

      const state = authorizationUrl.searchParams.get("state");
      const rawCookie = cookieHeader.match(/dehleez_device=([^;]+)/)?.[1];
      expect(state).toBeTruthy();
      expect(rawCookie).toBeTruthy();
      const result = await finishSwiggyAuthorization(
        makeRequest(`dehleez_device=${decodeURIComponent(rawCookie!)}`, { code: "test-code", state: state! }),
        response,
      );

      expect(result).toEqual({ origin: "http://localhost:5174", connected: true });
      expect(tokenRequest).toMatchObject({ client_id: "test-client", redirect_uri: expectedCallback, code: "test-code" });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("Swiggy MCP behavior", () => {
  it("has a separate endpoint for each supported service", () => {
    expect(Object.keys(servers)).toEqual(["food", "instamart", "dineout", "scenes"]);
    expect(new Set(Object.values(servers)).size).toBe(4);
  });

  it("renders product cards from structured MCP tool data", () => {
    const card = cardFromTool("search_products", {
      structuredContent: { data: { products: [{ spinId: "sku-1", name: "Fresh bananas", price: 49, imageUrl: "https://example.com/banana.jpg" }] } },
    });
    expect(card).toMatchObject({ type: "products", items: [{ id: "sku-1", name: "Fresh bananas", price: 49 }] });
  });

  it("renders restaurant cards from tool responses", () => {
    const card = cardFromTool("search_restaurants_dineout", {
      structuredContent: { data: { restaurants: [{ id: "place-1", name: "A test restaurant", avgRating: 4.2 }] } },
    });
    expect(card).toMatchObject({ type: "restaurants", items: [{ id: "place-1", name: "A test restaurant", rating: "4.2" }] });
  });

  it("surfaces address choices and distinguishes no saved address from an empty page", () => {
    const ranked = cardFromTool("get_addresses", {
      structuredContent: { data: { addresses: [{ id: "home-1", addressTag: "Home", addressLine: "1 Main Street" }], pagination: { total: 2 }, resolution: { defaultAddressId: "home-1", resolutionSource: "ranked_saved_address", needsUserClarification: true } } },
    });
    expect(ranked).toMatchObject({ type: "info", title: "Choose a delivery address" });
    const noSaved = cardFromTool("get_addresses", {
      structuredContent: { data: { addresses: [], pagination: { total: 0 }, resolution: { resolutionSource: "no_saved_address", needsUserClarification: true } } },
    });
    expect(noSaved).toMatchObject({ type: "info", title: "No saved delivery address" });
  });

  it("normalizes live payment methods and avoids persisting MCP tool responses", () => {
    const card = cardFromTool("get_payment_options", {
      structuredContent: { data: { allMethods: [{ id: "com.phonepe.app", displayName: "PhonePe" }], swiggyMoney: { available: true, id: "SwiggyPay", displayName: "Swiggy Money" } } },
    });
    expect(card).toMatchObject({ type: "payments", methods: [{ id: "com.phonepe.app", label: "PhonePe" }, { id: "SwiggyPay", label: "Swiggy Money" }] });
    expect(shouldStoreConversationTurn({ role: "user", parts: [{ functionResponse: { name: "get_addresses", response: { result: { address: "private" } } } }] })).toBe(false);
    expect(shouldStoreConversationTurn({ role: "user", parts: [{ text: "Find dinner" }] })).toBe(true);
  });

  it("requires explicit confirmation before cart and address mutations", () => {
    const history = [{ role: "model" as const, parts: [{ text: "Should I add one milk carton to your cart?" }] }];
    expect(canInvokeFinalAction("update_cart", history, "Yes, please")).toBe(true);
    expect(canInvokeFinalAction("create_address", [], "yes")).toBe(false);
  });
  it("requires an explicit confirmation after an assistant review question for final actions", () => {
    const history = [{ role: "model" as const, parts: [{ text: "Your order is ₹420. Shall I place the order now?" }] }];
    expect(canInvokeFinalAction("place_food_order", history, "Yes, please")).toBe(true);
    expect(canInvokeFinalAction("place_food_order", history, "No, thanks")).toBe(false);
    expect(canInvokeFinalAction("book_table", [], "yes")).toBe(false);
    expect(canInvokeFinalAction("search_restaurants", [], "Find dosa nearby")).toBe(true);
  });
});
