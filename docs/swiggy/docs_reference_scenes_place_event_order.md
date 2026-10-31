# place_event_order

> Scenes (Events & Shows): Place an event-ticket order after the user confirms the cart.

Scenes (Events & Shows): Place an event-ticket order after the user confirms the cart.

Paid flow: create_event_cart(checkoutMode=UPI) → text summary (user confirms) → get_payment_options → place_event_order (UPI) → check_payment_status (auto-polls + auto-confirms) → confirm_order (called automatically on SUCCESS).
Free flow: create_event_cart(checkoutMode=FREE) → user confirms → place_event_order(FREE), which recreates/reprices the selected cart and atomically checks out only if billToPay=0 and skipPayment=true.

INPUTS:
- cartKey: from create_event_cart
- paymentMethod: "UPI" for paid tickets; "FREE" only for an explicitly free cart
- UPI: intentApp from get_payment_options (byte-for-byte), or generateUPIQR=true for desktop
- FREE: venueId, showId, ticketId, showTime, guestCount, latitude, and longitude echoed from create_event_cart so the server can authoritatively recreate/reprice before checkout

OUTPUTS:
- data.paasId: payment transaction ID — pass to check_payment_status
- data.orderId: echo to check_payment_status + confirm_order
- data.upiIntentUrl: UPI deeplink (handled by UI — do NOT open yourself)
- data.isQrFlow: true = QR rendered; false = the selected UPI app is opened
- data.maxTimeToPollForInMs: polling window resolved from the payment provider

For paid UPI, the payment UI handles polling + confirm automatically. Do NOT call check_payment_status in a tight loop. Free tickets return an order ID immediately; trust the returned booking status and call get_event_booking_status if it is still PROCESSING.

## Usage notes

- Paid flow: `create_event_cart` returns `checkoutMode=UPI`, the user confirms the text summary from that response, then `get_payment_options`, then this tool, then payment status. `get_event_cart` is not part of the paid flow.
- Free flow: `create_event_cart` returns `checkoutMode=FREE`, the user confirms, then call this tool with `paymentMethod="FREE"` and the echoed event selection. The cart is repriced and only checked out if it is still free.
- For UPI, copy `intentApp` from `get_payment_options` byte-for-byte, or pass `generateUPIQR=true` for the desktop scan-QR path.
- Clients that render the payment UI poll payment status and confirm the order automatically. Do not call `check_payment_status` in a tight loop.
- A free ticket returns an order ID immediately. If its status is still processing, check `get_event_booking_status`.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "place_event_order",
  arguments: {
    cartKey: "cart_42",
    paymentMethod: "UPI",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "place_event_order",
  arguments={
    "cartKey": "cart_42",
    "paymentMethod": "UPI",
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
      "name": "place_event_order",
      "arguments": {
    "cartKey": "cart_42",
    "paymentMethod": "UPI"
      }
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `cartKey` | `string` | **yes** | Cart key from create_event_cart. |
| `paymentMethod` | `"UPI" \| "FREE"` | **yes** | Use "UPI" when create_event_cart returns checkoutMode=UPI. Use "FREE" only when it returns checkoutMode=FREE. |
| `intentApp` | `string` | no | UPI app id from get_payment_options (e.g. "com.phonepe.app"). Echo byte-for-byte. Omit for QR flow. |
| `generateUPIQR` | `boolean` | no | true for desktop scan-QR flow. |
| `venueId` | `string` | no | Required only for FREE tickets; echo from create_event_cart. |
| `showId` | `number` | no | Required only for FREE tickets; echo from create_event_cart. |
| `ticketId` | `string` | no | Required only for FREE tickets; echo from create_event_cart. |
| `showTime` | `number` | no | Required only for FREE tickets; echo the show_time_unix used for create_event_cart. |
| `guestCount` | `number` | no | Required only for FREE tickets; echo from create_event_cart. |
| `latitude` | `number` | no | Required only for FREE tickets; echo from create_event_cart. |
| `longitude` | `number` | no | Required only for FREE tickets; echo from create_event_cart. |

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
data:
  | {
      orderId: string;
      cartKey: string;
      status: string;
      paymentMethod: "FREE";
      restaurantName?: string;
      restaurantLocation?: string;
      reservationDate?: string;
      reservationTime?: string;
      guestCount?: number;
    }
  | {
      orderId: string;
      cartKey: string;
      paasId: string;
      transactionId: string;
      upiIntentUrl: string;
      bridgeUrl?: string;
      isQrFlow: boolean;
      pollingIntervalInMs: number;
      maxTimeToPollForInMs: number;
      status: "PENDING_PAYMENT";
      restaurantName?: string;
      restaurantLocation?: string;
      reservationDate?: string;
      reservationTime?: string;
      guestCount?: number;
    }
```

The first shape is returned for a free ticket, which is placed immediately. Its `status` is `CONFIRMED` once the booking is final and `PROCESSING` while it is still being verified - check `get_event_booking_status` before telling the user a `PROCESSING` booking succeeded.

The second shape is returned for a UPI ticket, where the order is not placed until payment succeeds.

The venue and show fields (`restaurantName` through `guestCount`) are filled in from a follow-up lookup that is allowed to fail without failing the booking, so treat them as optional in both shapes and fall back to `get_event_booking_status` when they are missing.

### Schema notes

- `paymentMethod`: use `"UPI"` only when `create_event_cart` returned `checkoutMode=UPI`, and `"FREE"` only when it returned `checkoutMode=FREE`.
- For a free ticket, echo `venueId`, `showId`, `ticketId`, `showTime`, `guestCount`, `latitude`, and `longitude` from the cart you created. The cart is recreated and repriced, and checkout happens only if it is still free.
- `status`: `PENDING_PAYMENT` means the ticket is not booked yet. Do not tell the user the booking succeeded until payment reaches a successful terminal status.
- `paasId` / `transactionId`: pass these to `check_payment_status`, and `orderId` to both `check_payment_status` and `confirm_order`.
- `upiIntentUrl` / `bridgeUrl` / `isQrFlow`: payment links for the UPI flow. Clients that render the payment UI handle these; `isQrFlow=true` means the user completes payment by scanning a QR code.
- `pollingIntervalInMs` / `maxTimeToPollForInMs`: how often to check payment status and how long to keep checking. Do not poll faster than the returned interval, and stop at a terminal status.
- `cartKey`: the cart this order was placed from. For a free ticket it is the recreated cart, so use the returned value rather than the one you sent.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `place_event_order` |
| **MCP Server** | [Scenes](https://mcp.swiggy.com/builders/docs/reference/scenes/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/scenes` |
| **Stage** | Booking |
| **Behaviour** | mutating |

## Next in this journey →

Continue with [`check_payment_status`](https://mcp.swiggy.com/builders/docs/reference/scenes/check_payment_status.md).
