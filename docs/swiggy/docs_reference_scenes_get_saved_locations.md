# get_saved_locations

> List the user's saved locations (addresses), ranked for selection, so you can choose which one to use. When several exist, confirm the location with the user, then pass the selected id as addressId to the next tool (e.g. a search). Coordinates are not returned; downstream tools resolve them by id.

List the user's saved locations (addresses), ranked for selection, so you can choose which one to use. When several exist, confirm the location with the user, then pass the selected id as `addressId` to the next tool (e.g. a search). Coordinates are not returned; downstream tools resolve them by id.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "get_saved_locations",
  arguments: {},
});
```

**Python**
```py
result = await session.call_tool(
  "get_saved_locations",
  arguments={},
)
```

**curl**
```bash
curl -X POST https://mcp.swiggy.com/scenes \
  -H "Authorization: Bearer $SWIGGY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_saved_locations",
      "arguments": {}
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `latitude` | `number` | no | Optional current latitude supplied by the client context. Pass only when the client provides it; never infer it or ask the user to type it. Must be paired with longitude. |
| `longitude` | `number` | no | Optional current longitude supplied by the client context. Pass only when the client provides it; never infer it or ask the user to type it. Must be paired with latitude. |

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
  locations: Array<{
    index: number;
    id: string;
    addressLine: string;
    phoneNumber: string;
    addressCategory?: string;
    addressTag?: string;
  }>;
}
```

This schema documents the structured payload returned by `get_saved_locations`. Optional fields can vary by user state, cart state, and live Swiggy availability.

### Schema notes

- `id`: stable identifier for a saved Swiggy location. Use the returned ID/coordinates in Scenes follow-up calls instead of deriving location from address text.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `get_saved_locations` |
| **MCP Server** | [Scenes](https://mcp.swiggy.com/builders/docs/reference/scenes/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/scenes` |
| **Stage** | Discover |
| **Behaviour** | read-only |

## Next in this journey →

Continue with [`discover_events`](https://mcp.swiggy.com/builders/docs/reference/scenes/discover_events.md).
