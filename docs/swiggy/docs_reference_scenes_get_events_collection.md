# get_events_collection

> Scenes (Events & Shows): Get events filtered by a specific collection, genre, or category. Use ONLY when the user picks a genre chip (Comedy, Music, Theatre, etc.) from discover_events results AND you have the numeric collectionIdentifier. Do NOT call this tool without a collectionIdentifier — if y…

Scenes (Events & Shows): Get events filtered by a specific collection, genre, or category. Use ONLY when the user picks a genre chip (Comedy, Music, Theatre, etc.) from discover_events results AND you have the numeric collectionIdentifier. Do NOT call this tool without a collectionIdentifier — if you do not have one, call discover_events first to get genre chips with their IDs. Do NOT use for keyword search — use search_events instead. Do NOT use for general browsing without a specific chip ID — use discover_events instead. Returns event cards with eventId, name, venue, date, and price — same format as discover_events. 

Required: collectionIdentifier from discover_events genre chips — you MUST have this before calling. 
Optional: latitude/longitude or addressId for location context. Pass the same location used in discover_events. 

Next step: user picks an event → call get_event_details with the eventId.

## Usage notes

- Call this only with a `collectionIdentifier` taken from the `collectionChips` returned by `discover_events`.
- Pass the same location you used for `discover_events` so the listing stays consistent.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "get_events_collection",
  arguments: {
    collectionIdentifier: "1042",
    addressId: "addr_01HXYZ",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "get_events_collection",
  arguments={
    "collectionIdentifier": "1042",
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
      "name": "get_events_collection",
      "arguments": {
    "collectionIdentifier": "1042",
    "addressId": "addr_01HXYZ"
      }
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `collectionIdentifier` | `string` | **yes** | Collection/genre ID obtained from genre chips on the events homepage. |
| `latitude` | `number` | no | User latitude for location-based results (optional). |
| `longitude` | `number` | no | User longitude for location-based results (optional). |
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
  events: Array<{
    eventId: string;
    eventName: string;
    venueName: string;
    area: string;
    date: string;
    price: string;
  }>;
}
```

The response also echoes the resolved `latitude` and `longitude` alongside `data`.

### Schema notes

- `price`: item-level price fields. They may differ before and after coupons, variants, add-ons, or stock updates; use cart/order totals for checkout.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `get_events_collection` |
| **MCP Server** | [Scenes](https://mcp.swiggy.com/builders/docs/reference/scenes/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/scenes` |
| **Stage** | Discover |
| **Behaviour** | read-only |

## Next in this journey →

Continue with [`get_event_details`](https://mcp.swiggy.com/builders/docs/reference/scenes/get_event_details.md).
