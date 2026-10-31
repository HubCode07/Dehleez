# Changelog

> What shipped when, grouped by release.

Tool-level changes are auto-discoverable from the [reference](https://mcp.swiggy.com/builders/docs/reference/index.md) pages (regenerated on every source change). This page tracks platform-level releases - new tools, new scopes, deprecations.

## v1.0 - 2026-04 (Builders Club launch)

**Shipped**

- Three MCP servers live: Food (20 tools), Instamart (19 tools), Dineout (12 tools).
- OAuth 2.1 authorization-code flow with PKCE (S256) on all endpoints. JWT signature validation is performed at the HAProxy edge.
- Streamable HTTP transport per [MCP spec](https://modelcontextprotocol.io).
- India-only region (AWS Mumbai primary, Singapore failover).
- Food widget registry wired (`hasWidgets: true`); hosted iframe layer not live.
- `llms.txt` + `llms-full.txt` at the docs root for agent-driven discovery.

**Known limitations**

- Cash-on-delivery only on Food ordering.
- Food cart cap ₹1000 for Builders Club origin orders.
- No in-app rate-limiter or `X-RateLimit-*` headers; gateway-enforced `429` + `Retry-After` still applies (see [rate-limits](https://mcp.swiggy.com/builders/docs/operate/rate-limits.md)).
- No symbolic `error.code` in the error envelope - branch on `error.message` + HTTP status (see [errors](https://mcp.swiggy.com/builders/docs/reference/errors.md)).
- No `_meta.swiggy.deprecation` response field - deprecation notices flow via email + changelog (see [versioning](https://mcp.swiggy.com/builders/docs/operate/versioning.md)).
- Instamart and Dineout widgets not shipped.
- Status page not live; incident comms via email.

## Tracking upstream

Items we're watching but can't put a version on, because they depend on
external standards work we don't control:

- **Signed client manifests** - candidate once the MCP spec around
  manifest signing stabilises upstream. Expect this to land in a
  later v1.x or v2 once the wire format is settled.

Dates are announced when work starts; we don't pre-commit.
