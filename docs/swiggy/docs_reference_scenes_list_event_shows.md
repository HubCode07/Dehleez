# list_event_shows

> Scenes (Events & Shows): Get detailed show listings for a specific event and venue. This is step 3 of the booking flow: discover/search → get_event_details → list_event_shows → create_event_cart. Returns available shows grouped by date — show times, seat availability, and ticket types with prices. …

Scenes (Events & Shows): Get detailed show listings for a specific event and venue. This is step 3 of the booking flow: discover/search → get_event_details → list_event_shows → create_event_cart. Returns available shows grouped by date — show times, seat availability, and ticket types with prices. Also includes venue details. Do NOT call get_event_venue_info before this — it is redundant. 

Required: eventId (Scenes event ID from get_event_details). 
Optional: venueId — from get_event_details; omit to get shows across all venues for the event. 
Optional: time ranges — dateSummaryStartTime/End (up to 30 days) and showStartTime/End (up to 5 days, max 100 shows). 
Optional: latitude/longitude for location context. 

Each show in the response includes: show_time_ist (human-readable IST time, e.g. "Thu, 10 Jul, 7:30 pm") — ALWAYS use this field to display show times to the user. show_time_unix (unix timestamp in seconds) — pass this directly to create_event_cart as showTime; do NOT compute it from any other field. 

Next step: user picks a show and ticket → call create_event_cart.

## Usage notes

- This is step three of the booking flow: discover or search, then `get_event_details`, then this tool, then `create_event_cart`.
- Pass `venueId` from `get_event_details`. Without it the listing spans every venue for the event and is not safe to book from.
- Display `show_time_ist` to the user and pass `show_time_unix` to `create_event_cart` unchanged.
- There is no need to call `get_event_venue_info` first — venue details are already included here.
- The date-summary window cannot exceed 30 days and the show window cannot exceed 5 days, capped at 100 shows.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "list_event_shows",
  arguments: {
    eventId: "event_42",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "list_event_shows",
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
      "name": "list_event_shows",
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
| `eventId` | `string` | **yes** | Scenes event ID from get_event_details. Required. |
| `venueId` | `string` | no | Scenes venue ID. If provided, returns shows only for that venue. Omit to get shows across all venues for the event. |
| `latitude` | `number` | no | Latitude for location context (optional). |
| `longitude` | `number` | no | Longitude for location context (optional). |
| `dateSummaryStartTime` | `string` | no | Start of date summary window (ISO-8601). Defaults to now. Window cannot exceed 30 days. |
| `dateSummaryEndTime` | `string` | no | End of date summary window (ISO-8601). Defaults to 30 days from now. |
| `showStartTime` | `string` | no | Start of show listing window (ISO-8601). Defaults to now. Window cannot exceed 5 days. Response capped at 100 shows. |
| `showEndTime` | `string` | no | End of show listing window (ISO-8601). Defaults to 5 days from now. |

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
  eventShowListing: {
    dateSummary?: unknown;
    venueDetails?: {
      venueId?: string;
      name?: string;
      address?: string;
      city?: string;
      latLng?: { latitude?: number; longitude?: number };
    };
    eventInfo?: {
      eventId?: string;
      title?: string;
      description?: string;
      genre?: string;
      language?: string;
      durationMinutes?: number;
    };
    dateGroupedEventShow?: Array<{
      date?: string;
      eventShow?: Array<{
        showId?: number;
        timeRange?: { startTime?: string; endTime?: string };
        show_time_unix?: number;
        show_time_ist?: string;
        availableSeats?: number;
        tickets?: Array<{
          ticketId?: string;
          ticketTitle?: string;
          price?: number;
        }>;
      }>;
    }>;
  };
}
```

Except for `show_time_unix` and `show_time_ist`, which are added for you, `data` is the live service payload passed through as returned, so treat every field as optional. `timeRange.startTime` carries no timezone offset - do not parse it yourself; use `show_time_ist` for display and `show_time_unix` for the next call.

The response also echoes `eventId`, `latitude`, and `longitude`, plus `venueId` when the call was scoped to a single venue. Shows that already started are removed, and date groups left empty are dropped.

### Schema notes

- `show_time_ist`: pre-formatted IST show time. Use it verbatim when showing show times to the user.
- `show_time_unix`: epoch seconds for the same show. Pass it to `create_event_cart` as `showTime` exactly as returned; converting the ISO time yourself produces the wrong value and the booking fails.
- `showId` and `tickets[].ticketId`: copy both from the show and ticket the user actually selected.
- Shows that have already started are filtered out, so an empty response means there is nothing left to book in the requested window.
- If the call was made without a `venueId`, the listing spans multiple venues and is not safe to book from. Confirm the venue, then call again with that `venueId` before creating a cart.
- `latitude` / `longitude`: coordinates from the selected saved location or restaurant context. Reuse returned values for follow-up slot, tracking, or payment calls; do not infer them from address text.
- `ticketId`: Scenes show/ticket fields. Copy identifiers from the exact show and ticket the user selected; do not derive them from display time or venue name.
- `price`: item-level price fields. They may differ before and after coupons, variants, add-ons, or stock updates; use cart/order totals for checkout.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `list_event_shows` |
| **MCP Server** | [Scenes](https://mcp.swiggy.com/builders/docs/reference/scenes/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/scenes` |
| **Stage** | Tickets |
| **Behaviour** | read-only |

## Next in this journey →

Continue with [`create_event_cart`](https://mcp.swiggy.com/builders/docs/reference/scenes/create_event_cart.md).
