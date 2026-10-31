# get_event_details

> Scenes (Events & Shows): Get full details for a specific event including venueId, venue name, address, upcoming date/time, and starting price. ALWAYS call this after discover_events and before list_event_shows — it provides the venueId required to fetch show schedules for a specific venue.

Scenes (Events & Shows): Get full details for a specific event including venueId, venue name, address, upcoming date/time, and starting price. ALWAYS call this after discover_events and before list_event_shows — it provides the venueId required to fetch show schedules for a specific venue. 

Required: eventId (from discover_events results). 
Optional: latitude/longitude for location context — pass the same coordinates used in discover_events. 

Returns: eventId, venueId, eventName, venueName, area, formattedAddress, upcomingDate, price. Pass both eventId and venueId to list_event_shows to get the show schedule.

## Usage notes

- Always call this between event discovery and the show listing. It is the only tool that returns `venueId`.
- Pass the same coordinates you used for discovery so the venue and pricing context match.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "get_event_details",
  arguments: {
    eventId: "event_42",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "get_event_details",
  arguments={
    "eventId": "event_42",
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
      "name": "get_event_details",
      "arguments": {
    "eventId": "event_42"
      }
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `eventId` | `string` | **yes** | Scenes event ID from discover_events. Required. |
| `latitude` | `number` | no | User latitude — pass the same value used in discover_events. |
| `longitude` | `number` | no | User longitude — pass the same value used in discover_events. |

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
  eventId: string;
  eventName: string;
  venueId: string;
  venueName: string;
  area: string;
  formattedAddress: string;
  venueLat: string;
  venueLng: string;
  upcomingDate: string;
  price: string;
}
```

`venueId` is only available here. Fetch it before requesting a show schedule for a specific venue.

### Schema notes

- `venueId`: required by `create_event_cart` and used to scope `list_event_shows` to one venue. This tool is the only source of it.
- `venueLat` / `venueLng`: venue coordinates as strings. They describe the venue, not the user; keep passing the user's own coordinates for location context.
- `price`: item-level price fields. They may differ before and after coupons, variants, add-ons, or stock updates; use cart/order totals for checkout.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `get_event_details` |
| **MCP Server** | [Scenes](https://mcp.swiggy.com/builders/docs/reference/scenes/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/scenes` |
| **Stage** | Discover |
| **Behaviour** | read-only |

## Next in this journey →

Continue with [`list_event_shows`](https://mcp.swiggy.com/builders/docs/reference/scenes/list_event_shows.md).
