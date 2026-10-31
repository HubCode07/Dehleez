# get_event_venue_info

> Scenes (Events & Shows): Lightweight venue + event metadata for an event. Returns venue name, address, location, and event metadata (title, genre, language, duration). Does NOT return show schedules or ticket types — use list_event_shows for booking. NOT part of the booking flow. Use this ONLY when…

Scenes (Events & Shows): Lightweight venue + event metadata for an event. Returns venue name, address, location, and event metadata (title, genre, language, duration). Does NOT return show schedules or ticket types — use list_event_shows for booking. NOT part of the booking flow. Use this ONLY when browsing which venues host an event without intent to book immediately. If you are about to call list_event_shows, skip this call — list_event_shows already includes venue details. 

Required: eventId (Scenes event ID). 
Optional: venueId — provide to get info for a specific venue; omit for all venues. 
Optional: time ranges and latitude/longitude for scoped results.

## Usage notes

- This tool is not part of the booking flow. Use it only when the user is browsing which venues host an event.
- Skip it if you are about to call `list_event_shows`, which already returns venue details.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "get_event_venue_info",
  arguments: {
    eventId: "event_42",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "get_event_venue_info",
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
      "name": "get_event_venue_info",
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
| `eventId` | `string` | **yes** | Scenes event ID. Required. |
| `venueId` | `string` | no | Scenes venue ID. If provided, returns info only for that venue. Omit to get all venues for the event. |
| `latitude` | `number` | no | Latitude for location context (optional). |
| `longitude` | `number` | no | Longitude for location context (optional). |
| `dateSummaryStartTime` | `string` | no | Start of date summary window (ISO-8601). Defaults to now. |
| `dateSummaryEndTime` | `string` | no | End of date summary window (ISO-8601). Defaults to 30 days from now. |
| `showStartTime` | `string` | no | Start of show window (ISO-8601). Defaults to now. |
| `showEndTime` | `string` | no | End of show window (ISO-8601). Defaults to 5 days from now. |

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
  venue_details?: {
    venue_id?: string;
    name?: string;
    address?: string;
    city?: string;
    lat_lng?: { latitude: number; longitude: number };
  };
  event_info?: {
    event_id?: string;
    title?: string;
    description?: string;
    genre?: string;
    language?: string;
    duration_minutes?: number;
  };
}
```

`data` is the live service payload, so its keys are snake_case here rather than camelCase. Alongside `data`, the response echoes `eventId`, plus `venueId`, `latitude`, and `longitude` when those can be resolved from your request or the response - treat all three as optional.

### Schema notes

- `venue_details.venue_id`: the venue identifier. Pass it to `list_event_shows` as `venueId` when the user has already picked a venue.
- `venue_details.lat_lng`: the venue's own coordinates, not the user's location.
- `event_info`: title, genre, language, and runtime for the event itself, repeated here so a venue card can be rendered without a second call.
- `latitude` / `longitude`: coordinates from the selected saved location or restaurant context. Reuse returned values for follow-up slot, tracking, or payment calls; do not infer them from address text.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `get_event_venue_info` |
| **MCP Server** | [Scenes](https://mcp.swiggy.com/builders/docs/reference/scenes/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/scenes` |
| **Stage** | Discover |
| **Behaviour** | read-only |

## Next in this journey →

Continue with [`list_event_shows`](https://mcp.swiggy.com/builders/docs/reference/scenes/list_event_shows.md).
