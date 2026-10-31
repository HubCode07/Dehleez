# discover_events

> Scenes (Events & Shows): Discover events near a location. Use for ANY genre/category query ("comedy shows", "music events", "open mic in Bangalore") AND for general browsing ("what's on this weekend"). Do NOT use if the user names a specific artist — use search_events for that. Returns event cards …

Scenes (Events & Shows): Discover events near a location. Use for ANY genre/category query ("comedy shows", "music events", "open mic in Bangalore") AND for general browsing ("what's on this weekend"). Do NOT use if the user names a specific artist — use search_events for that. Returns event cards (eventId, title, venue, date, price) AND collection chips with chip IDs (Comedy, Music, Theatre, etc). 

LOCATION IS REQUIRED. Provide location in ONE of these ways: (a) latitude + longitude if you have coordinates. (b) addressId from get_saved_locations if the user said "near my home/office/saved location". If neither is available, call get_saved_locations first or ask the user for a city/area. 

CRITICAL — for genre queries (e.g. "comedy shows in Bangalore"): Call discover_events to get the collection chips, find the chip whose label matches the genre (e.g. "Comedy"), then immediately call get_events_collection with that chip's ID to get the FULL comedy listing. Do NOT call search_events for genre queries — it returns at most 4 auto-suggest results, not the full catalogue. 

Next steps: (a) User picks a specific event → call get_event_details with the eventId. (b) User wants a genre (Comedy/Music/etc) → call get_events_collection with the matching chip ID.

## Usage notes

- Use this for genre and category queries ("comedy shows", "music events") and for open-ended browsing ("what's on this weekend").
- Location is required. Pass `latitude` and `longitude`, or an `addressId` from `get_saved_locations`. If you have neither, ask the user for a city or area first.
- For a genre query, read the returned `collectionChips`, find the chip whose label matches the genre, then call `get_events_collection` with its `collectionIdentifier` to get the full listing.
- When the user names a specific artist or show title, use `search_events` instead.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "discover_events",
  arguments: {
    addressId: "addr_01HXYZ",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "discover_events",
  arguments={
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
      "name": "discover_events",
      "arguments": {
    "addressId": "addr_01HXYZ"
      }
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `latitude` | `number` | no | User latitude. Provide this OR addressId — one is required. |
| `longitude` | `number` | no | User longitude. Provide this OR addressId — one is required. |
| `addressId` | `string` | no | Address ID from get_saved_locations. Server resolves coordinates automatically. Use when the user says "near my home/office" or picks a saved location. |

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
  collectionChips: Array<{
    collectionIdentifier: string;
    label: string;
  }>;
}
```

The response also echoes the resolved `latitude` and `longitude` alongside `data`. Reuse those exact coordinates for every follow-up Scenes call.

### Schema notes

- `eventId`: pass this to `get_event_details` to obtain the `venueId` needed for show schedules.
- `collectionChips`: genre/category chips for this location. To browse a genre, take the matching chip's `collectionIdentifier` and call `get_events_collection`; do not use `search_events` for genre queries.
- Image and media fields are removed from Scenes responses, so build the user-facing card from the returned text fields.
- `price`: item-level price fields. They may differ before and after coupons, variants, add-ons, or stock updates; use cart/order totals for checkout.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `discover_events` |
| **MCP Server** | [Scenes](https://mcp.swiggy.com/builders/docs/reference/scenes/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/scenes` |
| **Stage** | Discover |
| **Behaviour** | read-only |

## Next in this journey →

Continue with [`get_event_details`](https://mcp.swiggy.com/builders/docs/reference/scenes/get_event_details.md).
