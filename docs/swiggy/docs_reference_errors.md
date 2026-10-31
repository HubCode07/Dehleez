# Error codes

> How Swiggy MCP tools report failures, and how to react to each class of error.

## What the server emits today

All tools return failure responses in a uniform envelope:

```json
{
  "success": false,
  "error": {
    "message": "human-readable description",
    "reportId": "ERR-ABC123-DE45",
    "reportHint": "Run report_error to share diagnostics"
  }
}
```

- `message` - always present.
- `reportId` / `reportHint` - optional, surfaced when the server has captured a diagnostic bundle the caller can share with the Builders team.

Auth and other failures are additionally reported via JSON-RPC error codes at the transport layer: `-32001` (unauthenticated/expired sessions), `-32603` (unexpected internal failures), `-32003` (forbidden), and `-32000` (too-many-requests / method-not-allowed). Treat the HTTP status code and JSON-RPC code as secondary signals; the primary contract is the `error.message` string.

## How to classify errors today

There is no symbolic `error.code` field - classify by `error.message` prefix and HTTP / JSON-RPC status. The canonical buckets:

| Bucket | How to detect | React |
| --- | --- | --- |
| Auth failure | HTTP 401 or JSON-RPC `-32001` | Re-run the OAuth flow |
| Bad input | HTTP 400 with message starting `Invalid ...` / `Missing ...` | Fix the arguments; do not retry |
| Upstream timeout | HTTP 504 or message containing `timeout` | Exponential backoff, max 5 retries |
| Upstream error | HTTP 502/503 | Exponential backoff, max 5 retries |
| Domain failure | HTTP 200 with `success: false` | Read `message`; most are terminal (out of stock, slot gone, restaurant closed) - surface to the user, do not retry |
| Internal error | HTTP 500 or JSON-RPC `-32603` | Exponential backoff once; escalate via `report_error` if it persists |

For every failure, `report_error` is available on each server to generate a shareable diagnostic link.

## Retry strategy

Exponential backoff with jitter. Start at 500ms, double up to 8s, cap at 5 retries. See [Ship to production](https://mcp.swiggy.com/builders/docs/build/ship-to-production.md) for the full pattern and per-tool retry guidance.
