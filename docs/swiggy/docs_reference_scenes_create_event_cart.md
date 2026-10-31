# create_event_cart

> Scenes (Events & Shows): Create a cart for a specific event show and ticket. Call this after the user has selected a show from list_event_shows and confirmed the ticket type and guest count. Returns authoritative checkoutMode: FREE, UPI, or UNAVAILABLE from the created cart.

Scenes (Events & Shows): Create a cart for a specific event show and ticket. Call this after the user has selected a show from list_event_shows and confirmed the ticket type and guest count. Returns authoritative checkoutMode: FREE, UPI, or UNAVAILABLE from the created cart. 

Required: venueId (from get_event_details), showId and ticketId (from list_event_shows), showTime (unix timestamp), guestCount, latitude, longitude. 

CRITICAL: For showTime, use the show_time_unix field from list_event_shows directly. Never manually convert show_time (ISO string) to a unix timestamp — doing so causes wrong values and booking failures. 

After cart creation, follow checkoutMode. The response contains the authoritative text summary from the created cart. FREE: show the summary, wait for explicit confirmation, then call place_event_order(FREE) with the original event selection; do not call get_event_cart or payment tools. UPI: show the summary, wait for explicit confirmation, then call get_payment_options with the returned cartKey; do not call get_event_cart. UNAVAILABLE: stop safely.

## Usage notes

- Call this only after the user has picked a show and ticket type and confirmed the guest count.
- `guestCount` must be between 1 and 20, and `showTime` must be in the future.
- Pass `show_time_unix` from `list_event_shows` directly as `showTime`. Never convert the ISO show time yourself.
- The response carries the authoritative text summary of the created cart. Branch on the returned `checkoutMode`. For `FREE`, show the summary, wait for explicit confirmation, then call `place_event_order` with `paymentMethod="FREE"`; do not call `get_event_cart` or the payment tools. For `UPI`, show the summary, wait for explicit confirmation, then call `get_payment_options` with the returned `cartKey`; do not call `get_event_cart`. For `UNAVAILABLE`, stop and explain that the selection cannot be booked.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "create_event_cart",
  arguments: {
    venueId: "venue_42",
    showId: 424242,
    ticketId: "ticket_7",
    showTime: 1735675200,
    guestCount: 2,
    latitude: 12.9716,
    longitude: 77.5946,
  },
});
```

**Python**
```py
result = await session.call_tool(
  "create_event_cart",
  arguments={
    "venueId": "venue_42",
    "showId": 424242,
    "ticketId": "ticket_7",
    "showTime": 1735675200,
    "guestCount": 2,
    "latitude": 12.9716,
    "longitude": 77.5946,
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
      "name": "create_event_cart",
      "arguments": {
    "venueId": "venue_42",
    "showId": 424242,
    "ticketId": "ticket_7",
    "showTime": 1735675200,
    "guestCount": 2,
    "latitude": 12.9716,
    "longitude": 77.5946
      }
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `venueId` | `string` | **yes** | Scenes venue ID from get_event_details. |
| `showId` | `number` | **yes** | Show ID from list_event_shows — identifies the specific show slot. |
| `ticketId` | `string` | **yes** | Ticket ID from list_event_shows — identifies the ticket type selected. |
| `showTime` | `number` | **yes** | Show start time as a unix timestamp (seconds). Use the show_time_unix field from list_event_shows exactly as returned — do not convert from show_time ISO string. |
| `guestCount` | `number` | **yes** | Number of tickets/guests (1–20). |
| `latitude` | `number` | **yes** | User latitude. |
| `longitude` | `number` | **yes** | User longitude. |

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
  cart: {
    cartId?: string;
    cartKey: string;
    bill?: {
      billToPay?: number;
      skipPayment?: boolean;
      dineoutPricingInfo?: { billToPay?: number };
    };
  };
  cartKey: string;
  checkoutMode: "FREE" | "UPI" | "UNAVAILABLE";
}
```

`checkoutMode` is the authoritative branch for the rest of the flow. `FREE` means a zero-value cart that can be placed directly. `UPI` means the cart must be confirmed and paid for. `UNAVAILABLE` means the selection cannot be checked out and the flow should stop.

### Schema notes

- `checkoutMode`: the authoritative next step. `FREE` places the order directly, `UPI` goes through the text-summary confirmation and payment, and `UNAVAILABLE` means the selection cannot be booked.
- `cartKey`: pass it to `get_payment_options` and `place_event_order` exactly as returned. The normal paid flow does not call `get_event_cart`.
- A sold-out or unavailable show returns a non-retryable error. Show the returned message and ask the user to pick a different show instead of retrying.
- `cartId` / `cartKey`: server-side cart reference for the current authenticated session. Use it only for the immediate follow-up flow; refresh the cart if the user changes items, address, slot, or payment path.
- `billToPay`: payable/order total fields. Show these as live values and refresh the cart or order state before final placement if anything changes.
- `skipPayment`: Scenes payment/price indicators. Paid tickets must go through the payment flow; free tickets can be placed directly after the user confirms.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `create_event_cart` |
| **MCP Server** | [Scenes](https://mcp.swiggy.com/builders/docs/reference/scenes/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/scenes` |
| **Stage** | Tickets |
| **Behaviour** | mutating |

## Next in this journey →

Continue with [`get_payment_options`](https://mcp.swiggy.com/builders/docs/reference/scenes/get_payment_options.md).
