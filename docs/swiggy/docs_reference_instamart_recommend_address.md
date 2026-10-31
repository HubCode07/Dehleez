# recommend_address

> Swiggy: Geocode a free-text address to coordinates and a formatted address string. Use this when you have an address string and need to resolve its geographic location — for example, to validate an address before creating it, or to get coordinates for a locality/area. Returns lat/lng and the full f…

Swiggy: Geocode a free-text address to coordinates and a formatted address string. Use this when you have an address string and need to resolve its geographic location — for example, to validate an address before creating it, or to get coordinates for a locality/area. Returns lat/lng and the full formatted address from Swiggy's address-recommendations service.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "recommend_address",
  arguments: {
    address: "221B Baker Street",
    postalCode: "...",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "recommend_address",
  arguments={
    "address": "221B Baker Street",
    "postalCode": "...",
  },
)
```

**curl**
```bash
curl -X POST https://mcp.swiggy.com/im \
  -H "Authorization: Bearer $SWIGGY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "recommend_address",
      "arguments": {
    "address": "221B Baker Street",
    "postalCode": "..."
      }
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `address` | `string` | **yes** | Full or partial address text to geocode (e.g. "Indiranagar 100ft Road, Bangalore") |
| `postalCode` | `string` | **yes** | Postal/ZIP code (required) |
| `city` | `string` | no | City name (optional, improves accuracy) |
| `locality` | `string` | no | Area or locality name (optional, improves accuracy) |

Session credentials (user identity, access token) are supplied automatically by the authenticated MCP session - you do not pass them in the tool call. See [Authenticate](https://mcp.swiggy.com/builders/docs/start/authenticate.md).

## Response

All Swiggy MCP tools return:

```json
{
  "success": true,
  "data": { /* tool-specific payload */ },
  "message": "optional human-readable message"
}
```

On failure:

```json
{
  "success": false,
  "error": { "message": "description of what went wrong" }
}
```

See [Error codes](https://mcp.swiggy.com/builders/docs/reference/errors.md) for the full catalogue.

### Output schema

```ts
data: {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}
```

This schema documents the structured payload returned by `recommend_address`. Optional fields can vary by user state, cart state, and live Swiggy availability.

### Schema notes

- `latitude` / `longitude`: coordinates from the selected saved location or restaurant context. Reuse returned values for follow-up slot, tracking, or payment calls; do not infer them from address text.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `recommend_address` |
| **MCP Server** | [Instamart](https://mcp.swiggy.com/builders/docs/reference/instamart/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/im` |
| **Stage** | Support |
| **Behaviour** | read-only |
