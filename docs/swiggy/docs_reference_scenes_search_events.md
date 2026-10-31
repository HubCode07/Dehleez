# search_events

> Scenes (Events & Shows): Auto-suggest search for a SPECIFIC artist name or show name. Use ONLY when the user names a specific person or exact event title (e.g. "Zakir Khan", "Anshu Mor", "Munawar Faruqui"). Returns at most 4 suggestions — this is intentional (it is an auto-suggest endpoint, NOT a f…

Scenes (Events & Shows): Auto-suggest search for a SPECIFIC artist name or show name. Use ONLY when the user names a specific person or exact event title (e.g. "Zakir Khan", "Anshu Mor", "Munawar Faruqui"). Returns at most 4 suggestions — this is intentional (it is an auto-suggest endpoint, NOT a full catalogue search). 

Do NOT use this for genre/category queries like "comedy shows", "music events", "open mic" — those will return only 1 result or nothing. For genre browsing: call discover_events first to get collection chip IDs, then call get_events_collection with the Comedy/Music/etc chip. 

Required: query (specific artist or show name). Optional: latitude/longitude or addressId for location context. 

If no results: inform the user and suggest calling discover_events instead. Do NOT retry the same query.

## Usage notes

- Use only when the user names a specific artist or an exact show title.
- This is an auto-suggest surface and returns at most four results. For genre browsing, use `discover_events` followed by `get_events_collection`.
- If nothing is found, tell the user and offer `discover_events`. Do not retry the same query.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "search_events",
  arguments: {
    query: "Zakir Khan",
    addressId: "addr_01HXYZ",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "search_events",
  arguments={
    "query": "Zakir Khan",
    "addressId": "addr_01HXYZ",
  },
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
      "name": "search_events",
      "arguments": {
    "query": "Zakir Khan",
    "addressId": "addr_01HXYZ"
      }
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `query` | `string` | **yes** | Search keyword or event/artist name (e.g. "comedy", "Zakir Khan", "Punjabi night"). |
| `latitude` | `number` | no | User latitude for location context (optional). |
| `longitude` | `number` | no | User longitude for location context (optional). |
| `addressId` | `string` | no | Address ID from get_saved_locations. Server resolves coordinates automatically. |

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
  suggestions: Array<{
    eventId: string;
    eventName: string;
    location: string;
  }>;
}
```

At most four suggestions are returned. This is an auto-suggest surface, not a full catalogue search.

### Schema notes

- `eventId`: pass this to `get_event_details` to continue the booking flow.
- An empty `suggestions` list means the specific artist or title was not matched. Fall back to `discover_events` rather than retrying the same query.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `search_events` |
| **MCP Server** | [Scenes](https://mcp.swiggy.com/builders/docs/reference/scenes/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/scenes` |
| **Stage** | Discover |
| **Behaviour** | read-only |

## Next in this journey →

Continue with [`get_event_details`](https://mcp.swiggy.com/builders/docs/reference/scenes/get_event_details.md).
