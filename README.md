# Dehleez

An accessible ordering experience for Swiggy Food, Instamart, Dineout, and Scenes. Sunao uses Gemini function calling and the Swiggy MCP servers to help people search, review choices, and place orders with explicit confirmation.

## Run locally

1. Install Node.js 22.13+.
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.
3. Install dependencies and start both services:

   ```sh
   npm install
   npm run dev
   ```

4. Open `http://localhost:5173`, then choose **Connect Swiggy**. Local callback URLs are allowed for development; production callback URIs must be HTTPS and allowlisted by Swiggy.

The frontend remains viewable without database or API credentials. Live search, chat, and ordering require the API configuration above.

## Architecture

- `src/` is a responsive React/Vite app using the existing shadcn component system.
- `server/` is a TypeScript Express API. It stores device sessions and encrypted Swiggy token pairs in a local SQLite database at `data/dehleez.sqlite`, calls Gemini, and connects to Swiggy with the official MCP TypeScript SDK.
- Dehleez creates the SQLite database and a device-local token encryption key on first run. No database server, account, or `DATABASE_URL` is needed. Data stays on this computer; it is not shared across devices.
- The app uses a random HttpOnly, SameSite=Lax device cookie. It does not include Dehleez account sign-in in this phase.
- `GET /api/session` creates or reads the device session and returns connection readiness without exposing credentials.
- `POST /api/auth/swiggy/start` begins OAuth 2.1 with PKCE; `/api/auth/swiggy/callback` exchanges the code and stores the encrypted token pair. During local development, Dehleez uses the browser's actual localhost origin (including Vite's selected port) and saves that exact callback URI for the return. In production, set `APP_ORIGIN` to the public application origin and have Swiggy allowlist the exact HTTPS callback URI.
- `POST /api/chat` accepts `{ "vertical": "food|instamart|dineout|scenes", "message": "..." }` and returns Sunao’s response, tool activity, structured fallback cards, and any MCP widget resources.
- The MCP tool list is fetched per service and passed to Gemini as function declarations. Tool responses are passed back to Gemini for multi-step flows. Irreversible ordering and booking tools require a confirmation turn.
- MCP widget HTML is isolated in an iframe with scripts enabled and same-origin access disabled. The structured tool data is also rendered by the accessible Dehleez result cards.

## Configuration

| Variable | Purpose |
| --- | --- |
| `DEHLEEZ_DB_PATH` | Optional local SQLite file path (defaults to `data/dehleez.sqlite`) |
| `GEMINI_API_KEY` | Server-side Gemini API key |
| `GEMINI_MODEL` | Gemini model ID; defaults to `gemini-2.5-flash` |
| `TOKEN_ENCRYPTION_KEY` | Optional base64-encoded 32-byte AES-256-GCM key override; by default Dehleez creates a local key file beside the SQLite database |
| `APP_ORIGIN` | Frontend origin used for the OAuth callback |
| `PORT` | API server port (default `8787`) |

Never commit `.env` or expose `GEMINI_API_KEY`, Swiggy OAuth tokens, or `TOKEN_ENCRYPTION_KEY` to browser code or logs. The local SQLite file and generated key are ignored by Git. Production use should provide TLS, managed persistent storage, secret rotation, and Swiggy delegated-auth onboarding.

## Source license

Some ordering guidance and behavior are adapted from `swiggy-mcp-demo-main`. Its non-commercial source license is preserved in [`THIRD_PARTY_LICENSES/swiggy-mcp-demo-main-LICENSE`](THIRD_PARTY_LICENSES/swiggy-mcp-demo-main-LICENSE). Commercial use requires prior written permission from its copyright holder.
