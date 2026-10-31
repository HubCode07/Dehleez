# Authenticate

> OAuth 2.1 with PKCE - how allowlisting, authorization, and expired tokens work.

Swiggy MCP uses **OAuth 2.1 with PKCE** for every external caller. The same flow Claude Desktop, Cursor, and ChatGPT use automatically is what your agent framework uses under the hood. Understand it here, then let your framework handle it in production.

If you're a platform operator brokering Swiggy for end users (voice assistant, in-app agent), read [delegated auth](https://mcp.swiggy.com/builders/docs/start/enterprise/delegated-auth.md) instead - this page covers the direct developer flow.

## The flow at a glance

```
┌──────────┐                  ┌─────────────┐
│  Client  │                  │   Swiggy    │
│ (your    │                  │   OAuth     │
│  agent)  │                  │   server    │
└────┬─────┘                  └──────┬──────┘
     │  1. /authorize (PKCE S256)    │
     ├──────────────────────────────►│
     │                               │  2. Phone + OTP in browser
     │  3. 302 → redirect_uri + code │
     │◄──────────────────────────────┤
     │                               │
     │  4. POST /auth/token          │
     │     (code + verifier)         │
     ├──────────────────────────────►│
     │                               │  5. Issue signed JWT
     │◄──────────────────────────────┤
     │  { access_token, expires_in } │
     │                               │
     │  6. POST /food                │
     │     Authorization: Bearer ... │
     ├──────────────────────────────►│
```

## Endpoints

Base: `https://mcp.swiggy.com`

| Endpoint | Purpose |
| --- | --- |
| `GET  /auth/authorize` | Start the flow - user lands on consent UI |
| `POST /auth/token` | Exchange authorization code for access token |
| `POST /auth/logout` | Revoke current session |
| `GET  /.well-known/oauth-authorization-server` | OAuth server metadata (RFC 8414) |
| `GET  /.well-known/oauth-protected-resource` | Resource metadata (RFC 9728) |

The consent UI served at `/auth/authorize` uses internal endpoints (`/auth/send-otp`, `/auth/verify-otp`) to collect phone + OTP in the browser - these are **not part of the OAuth contract** and are not callable by third-party clients.

## Step-by-step (manual walkthrough)

You don't need to apply for or manage a client identity. Swiggy MCP supports [Dynamic Client Registration (RFC 7591)](https://datatracker.ietf.org/doc/html/rfc7591) at `POST /auth/register` - MCP-compatible clients (Claude Desktop, Cursor, ChatGPT, mcp-remote) call it transparently and you never see the step.

### 1. Generate PKCE verifier + challenge

```ts

const codeVerifier = crypto.randomBytes(32).toString("base64url");
const codeChallenge = crypto
  .createHash("sha256")
  .update(codeVerifier)
  .digest("base64url");
```

### 2. Redirect the user to `/auth/authorize`

```
https://mcp.swiggy.com/auth/authorize?
  response_type=code&
  client_id=<from-dcr>&
  redirect_uri=<your-callback>&
  code_challenge=<codeChallenge>&
  code_challenge_method=S256&
  state=<random-csrf-token>&
  scope=mcp:tools
```

### 3. Exchange the code

Your `redirect_uri` receives `?code=...&state=...`. Exchange:

```bash
curl -X POST https://mcp.swiggy.com/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "<code-from-step-2>",
    "code_verifier": "<verifier-from-step-1>",
    "redirect_uri": "<your-callback>"
  }'
```

Response:

```json
{
  "access_token": "eyJhbGciOiJI...",
  "refresh_token": "eyJhbGciOiJI...",
  "token_type": "Bearer",
  "expires_in": 432000,
  "scope": "mcp:tools mcp:resources mcp:prompts"
}
```

### 4. Call Swiggy MCP

```
POST /food HTTP/1.1
Host: mcp.swiggy.com
Authorization: Bearer eyJhbGciOiJI...
```

## Scopes

| Scope | Grants |
| --- | --- |
| `mcp:tools` | Call any tool on any Swiggy MCP server the authenticated user is allowed to use |
| `mcp:resources` | Read MCP resources (widget registry, static metadata) |
| `mcp:prompts` | Access server-supplied prompt templates |

The v1 scope model is **server-level**, not read/write-split. Access to Food, Instamart, Dineout, and Scenes is controlled at the user level (via the user's Swiggy account) rather than via per-application allowlists.

## Redirect URIs

- **HTTPS required** (except `http://localhost` for local development)
- Exact-match allowlist - no wildcards
- Custom schemes allowed for known MCP clients (`cursor://`, `vscode://`, `claude://`, `windsurf://`)
- No open redirects

To register a new client redirect URI or scheme, email [builders@swiggy.in](mailto:builders@swiggy.in).

## Token lifecycle

| Item | Lifetime |
| --- | --- |
| Access token | 5 days |
| Refreshed token | 30 days from each refresh |
| User session | 30 days idle, sliding |
| Authorization code | 120 seconds, single-use |

Tokens can be revoked server-side before `exp` (user logs out, security event). On a 401, try a token refresh first and fall back to re-running authorization; never cache success assumptions.

## Handling expired tokens

Refresh tokens are supported. `/auth/token` accepts `grant_type=refresh_token` and returns a new access token (and a new refresh token), so the 5-day access token can be refreshed rather than forcing a full re-auth. Fall back to the authorization flow only if the refresh itself fails (e.g. the refresh token is expired or revoked).

```ts
// Exchange a refresh token for a fresh access token.
async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://mcp.swiggy.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error("refresh_failed");
  return res.json(); // { access_token, refresh_token, expires_in, ... }
}

// On a 401: refresh first, re-authorize only if refresh fails.
async function callWithReauth<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    // Auth failures surface as HTTP 401 or JSON-RPC -32001 at the transport layer.
    const rpcCode = e?.body?.error?.code ?? e?.code;
    if (e?.status === 401 || rpcCode === -32001) {
      try {
        await refreshSession(); // calls refreshAccessToken + stores the result
      } catch {
        await reAuthenticate(); // full authorization flow
      }
      return fn();
    }
    throw e;
  }
}
```

Most frameworks handle this for you. For raw MCP clients, wrap your `callTool` in the pattern above.

### Refresh request and response

Send the refresh as a JSON body (`Content-Type: application/json`). No `Authorization` header is needed.

| Field | Required | Notes |
| --- | --- | --- |
| `grant_type` | Yes | Always `refresh_token` |
| `refresh_token` | Yes | The token from the authorization flow, or the one returned by your last refresh |
| `user_id` | No | If sent, it must match the user the token was issued to |

```json
{
  "access_token": "eyJ0eXAiOiJKV1Qi...",
  "token_type": "Bearer",
  "expires_in": 2592000,
  "refresh_token": "eyJ0eXAiOiJKV1Qi..."
}
```

- Each refresh returns a token valid for 30 days (`expires_in` is in seconds; read it from the response). It only works while the user's session is active.
- The response does not include `user_id`. Read the `user_id` claim from the token payload if you need it.
- Errors use the OAuth shape, `{ "error": "...", "error_description": "..." }`: `400 invalid_request` (missing or malformed token), `400 invalid_grant` (invalid signature, expired token, or `user_id` mismatch; do not retry, re-run authorization), `500 server_error` (retry with backoff).
- An expired token cannot be refreshed, so refresh before `expires_at`.

## What to store

- Store `access_token` in memory or secure storage (OS keychain, vault).
- Store the `refresh_token` returned alongside it in secure storage. It **rotates** — each `grant_type=refresh_token` exchange returns a new `refresh_token` (currently the same value as the new `access_token`), so persist the latest one and discard the old.
- Store `expires_at = now() + expires_in` and proactively refresh when ≤ 60s remain.
- **Never** log tokens to disk in plaintext.
- **Never** send tokens over non-HTTPS transports.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| 401 on every call | No or invalid session token | Re-run authorization |
| 401 after some time | Token expired | Refresh the access token (`grant_type=refresh_token`); re-authorize only if the refresh fails |
| 419 | Session revoked | Full re-auth (phone + OTP) |
| 403 | Scope too narrow | Re-auth with broader scope |
| Stuck on `/authorize` | Bad `redirect_uri` | Must exact-match allowlisted URI |
| "Cannot resolve session" | Missing `Authorization` header | Add `Bearer <token>` to every call |

See [Ship to production](https://mcp.swiggy.com/builders/docs/build/ship-to-production.md) for the full error-handling pattern.
