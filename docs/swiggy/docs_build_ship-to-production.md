# Ship to production

> Retries, observability, and the go-live checklist.

You've built it. Before flipping production traffic on, here's the punch list.

## Errors and retries

### Idempotency by tool class

| Class | Examples | Safe to retry on failure? |
| --- | --- | --- |
| **Pure reads** | `get_addresses`, `search_restaurants`, `get_order_details` | Always |
| **Cart mutations** | `update_cart`, `update_food_cart`, `clear_cart`, `flush_food_cart` | Yes - these set absolute cart state (not a delta), so retrying the same args is naturally safe and won't double-add |
| **Order placement** | `place_food_order`, `checkout`, `book_table` | **No**, not by default - see below |
| **Coupon application** | `apply_food_coupon` | Yes |
| **Tracking** | `track_order`, `track_food_order`, `get_booking_status` | Always |

### Order placement (non-idempotent)

`place_food_order`, `checkout`, and `book_table` are **not safe to blind-retry** on network failure. Instead:

1. On 5xx or network error, wait 2-5 seconds.
2. Call `get_food_orders` / `get_orders` / `get_booking_status` to check if the order actually went through.
3. If yes, treat the original failure as success.
4. If no, retry the original call.

There is no server-side idempotency enforcement and no `Idempotency-Key` header - the check-then-retry pattern above is how you stay safe.

### Exponential backoff

For retriable failures (generic 5xx and upstream timeouts / errors - branch on HTTP / transport status, since the error envelope does not carry a symbolic `error.code`):

```ts
async function retry<T>(fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e: any) {
      attempt++;
      if (attempt >= maxAttempts) throw e;
      if (!isRetryable(e)) throw e;
      const baseMs = 500 * 2 ** (attempt - 1); // 500, 1000, 2000, 4000
      const jitterMs = Math.random() * baseMs * 0.3;
      await new Promise((r) => setTimeout(r, baseMs + jitterMs));
    }
  }
}

function isRetryable(e: any) {
  // The error envelope carries no symbolic `error.code`; decide on HTTP /
  // transport status.
  const status = e?.status ?? e?.response?.status;
  // Transient network failure or timeout: the request never received a
  // response, so there is no HTTP status at all. Safe to retry.
  if (status == null) return true;
  // 5xx (and JSON-RPC -32603 internal) are retriable; generic 4xx are not.
  if (status >= 500 && status < 600) return true;
  const rpcCode = e?.body?.error?.code ?? e?.code; // JSON-RPC transport code
  return rpcCode === -32603;
}
```

> **Warning**
>
> Only wrap **idempotent reads** (and cart mutations that set absolute state) in this generic `retry()`. **Never** wrap `place_food_order`, `checkout`, or `book_table` — a lost response has no HTTP status, so `isRetryable` would retry it blindly, and with no server-side idempotency that can place a **duplicate order**. For those, use the check-then-retry flow above instead.

### Auth failures (401)

Re-run the OAuth flow. Never retry with the same token. Auth errors also surface via JSON-RPC `-32001` at the transport layer.

```ts
if (response.status === 401) {
  await reAuthenticate();
  return retry();
}
```

### Rate limited (429)

The gateway enforces per-user and aggregate caps. When you exceed one, the call returns `429 Too Many Requests` with a `Retry-After` header (JSON-RPC `-32000`). There are no `X-RateLimit-*` headers to pre-empt it. Honor `Retry-After` — wait that long before retrying, and don't stack it on top of your exponential backoff.

```ts
if (response.status === 429) {
  const seconds = Number(response.headers.get("Retry-After") ?? 30);
  await new Promise((r) => setTimeout(r, seconds * 1000));
  return retry();
}
```

### Retry budget

For user-facing flows: **cap total retries at 30 seconds of wall-clock time.** Beyond that, fail loudly and let the user decide.

## Observability

### Generate your own correlation id

The MCP HTTP transport is stateless - it tracks no session and returns no per-call session id. Generate your own correlation/request id for every tool call and log it on your side. When you file a support ticket, include the correlation id and the timestamp of the failing call so we can line it up against our logs.

### Recommended client-side log shape

```json
{
  "ts": "2026-04-17T10:00:00Z",
  "level": "info",
  "event": "mcp_tool_call",
  "tool": "search_restaurants",
  "user_id_hash": "sha256:...",
  "correlation_id": "...",
  "duration_ms": 217,
  "status": "ok"
}
```

Hash user IDs at rest unless you have a specific DPDP-compliant reason to store them plaintext. See [data-and-compliance](https://mcp.swiggy.com/builders/docs/operate/data-and-compliance.md).

### Metrics to track client-side

| Metric | Why |
| --- | --- |
| Tool call latency (p50, p95, p99) | Surface regressions before users notice |
| Tool call success rate | Catches partial outages |
| 4xx / 5xx rate | Separates client bugs from server bugs |
| OAuth refresh frequency | Unusually high = token-management bug |

### OpenTelemetry

If your platform supports OpenTelemetry, instrument every `callTool` with a span. Tag it with your correlation id. When you cross-reference with Swiggy support, we'll be on the same timeline.

### What Swiggy exposes

- Incident comms via email to your designated engineering contact.
- Per-partner usage dashboards for enterprise integrators.

### What's not available

- Raw server logs (security / privacy).
- Infra dashboards.
- User-level audit logs (only on lawful request - see [data-and-compliance](https://mcp.swiggy.com/builders/docs/operate/data-and-compliance.md)).

## Go-live checklist

Before your first real-user traffic:

- [ ] **Access**: staging has been green for ≥ 48 hours and production access has been confirmed by [builders@swiggy.in](mailto:builders@swiggy.in).
- [ ] **Redirect URIs**: every URL your OAuth flow might redirect to is allowlisted (exact-match).
- [ ] **Servers**: you've confirmed which Swiggy MCP servers your integration calls (`food`, `instamart`, `dineout`, `scenes`); v1 scopes (`mcp:tools`/`mcp:resources`/`mcp:prompts`) are requested uniformly.
- [ ] **Error handling**: retry logic per this page is in place; auth failures (401 / JSON-RPC `-32001`) and upstream timeouts each have an explicit branch.
- [ ] **Idempotency guards**: order-placement paths do check-then-retry, not blind retry.
- [ ] **Cart confirmation**: no order is placed without user-visible confirmation of items + total.
- [ ] **Rate limits**: you've benchmarked your expected QPS and confirmed you're under the ceiling ([rate-limits](https://mcp.swiggy.com/builders/docs/operate/rate-limits.md)).
- [ ] **Observability**: a correlation id logged on every call; metrics exported to your usual observability stack.
- [ ] **Incident contact**: Swiggy has an email + Slack channel to reach your on-call for S0/S1.
- [ ] **Data handling**: your product's data retention, deletion, and consent flows align with [data-and-compliance](https://mcp.swiggy.com/builders/docs/operate/data-and-compliance.md).
- [ ] **Voice vs chat**: if you have a voice surface, your prompts are shaped per [voice-vs-chat](https://mcp.swiggy.com/builders/docs/build/agent-patterns/voice-vs-chat.md).
- [ ] **Support runbook**: you've written an internal runbook for "what do we do when Swiggy returns X".
- [ ] **Rollout**: traffic ramps 1% → 10% → 50% → 100% over at least 24 hours so any regression is caught early.

## When to escalate

If production traffic is failing and you've already:

1. Verified tokens are fresh and scopes match.
2. Confirmed you're hitting the right endpoints.
3. Seen a sudden error-rate spike on Swiggy's side (not yours).

...mail [builders@swiggy.in](mailto:builders@swiggy.in) with the failing correlation ids and timestamps. Enterprise partners use their designated engineering contact + SEV channel.
