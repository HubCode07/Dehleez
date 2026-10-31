# Rate limits

> How Swiggy MCP handles traffic today and how to be a good citizen as a caller.

## Status today

Swiggy MCP does **not** run an in-app rate-limiter, and it sets **no** `X-RateLimit-*` response headers. But tool calls are **not** unlimited — the API gateway enforces per-user and aggregate request caps.

- **No** `X-RateLimit-*` headers and **no** in-app limiter middleware, so you can't read your remaining quota from a response.
- **Yes**, you can receive **`429 Too Many Requests`** with a **`Retry-After`** header when a gateway cap is hit. At the MCP layer this surfaces as JSON-RPC error `-32000`. **Honor `Retry-After`** and back off before retrying (see [Ship to production](https://mcp.swiggy.com/builders/docs/build/ship-to-production.md)).
- The OTP send/verify endpoints on the auth flow are separately throttled upstream.

Exact caps aren't published here and may change. If you're planning production traffic at scale, email [builders@swiggy.in](mailto:builders@swiggy.in) before you launch so we can confirm there's headroom for your use case.

## Be a good citizen

Since caps are gateway-enforced but not visible in response headers, build as though limits exist so your integration stays resilient and doesn't degrade the service for others:

- **Keep concurrency reasonable** - don't fan out large bursts of parallel calls when a sequence will do.
- **Back off on transient upstream errors** - exponential backoff with jitter on 5xx, with a sensible retry ceiling.
- **Batch where possible** - one `get_addresses` per session is plenty; don't re-fetch on every turn.
- **Cache low-churn data** - saved addresses, restaurant metadata, menu images change slowly.
- **Don't poll `track_*` faster than 10s** - delivery-partner ETA updates arrive at that cadence.
- **Separate user activity from background jobs** - if you run nightly analytics, talk to us at onboarding so we're aware of that traffic shape.

## Connection & session hygiene

- **One session per user, not one per request.** Auth happens once per connection. Do not reconnect on every tool call.
- **Initialize domains sequentially, not in parallel.** Connecting to `/im`, `/food`, `/dineout`, and `/scenes` simultaneously multiplies your auth handshakes; connect to one domain, wait for success, then connect to the next.
- **Never create a new initialize handshake per tool invocation.** One persistent session handles all tool calls.
- **Back off on auth errors.** If connection attempts are failing, stop and apply backoff rather than retrying in a tight loop; if you stay blocked, raise a request to [builders@swiggy.in](mailto:builders@swiggy.in).

## Voice & ambient guidance

Voice agents and TV surfaces have different shapes than text chat:

- **Lower QPS, higher burstiness** - a user says "order food" and your agent makes 4-6 tool calls in 3 seconds.
- **Peak-hour amplification** - Indian mealtime traffic (12:00-14:00, 19:00-22:00 IST) amplifies through voice surfaces.
- **Stick to `your_go_to_items` for reorders** - one call replaces 3-5 search calls for a returning user.
