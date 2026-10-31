# get_event_cart

> Scenes (Events & Shows): Compatibility lookup for an existing event cart. The normal flow does not call this after create_event_cart because create_event_cart already returns the authoritative cart summary. If invoked directly, return the cart as text only; do not retry it after a create response a…

Scenes (Events & Shows): Compatibility lookup for an existing event cart. The normal flow does not call this after create_event_cart because create_event_cart already returns the authoritative cart summary. If invoked directly, return the cart as text only; do not retry it after a create response and do not expect a payment status flow. For a paid cart, proceed to get_payment_options with the exact cartKey only when the response says paymentAvailable=true; otherwise direct the user to the Swiggy app. Do not call this tool for checkoutMode=FREE because a free cart cannot be read back; wait for confirmation and use the FREE place_event_order contract instead.

Required: cartKey (from create_event_cart), latitude, longitude.

## Usage notes

- Compatibility lookup, not a booking step. The normal flow skips this because `create_event_cart` already returns the authoritative cart summary.
- Call this only for a `UPI` cart. A `FREE` cart cannot be read back here.
- If invoked directly, return the cart as text only. Do not retry it after a `create_event_cart` response and do not expect a payment status flow.
- Continue to `get_payment_options` with the exact `cartKey` only when `paymentAvailable` is `true`.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "get_event_cart",
  arguments: {
    cartKey: "cart_42",
    latitude: 12.9716,
    longitude: 77.5946,
  },
});
```

**Python**
```py
result = await session.call_tool(
  "get_event_cart",
  arguments={
    "cartKey": "cart_42",
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
      "name": "get_event_cart",
      "arguments": {
    "cartKey": "cart_42",
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
| `cartKey` | `string` | **yes** | Cart key returned by create_event_cart. |
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
      skipPayment?: boolean;
      dineoutPricingInfo?: { billToPay?: number; totalFee?: number };
      charges?: Array<{
        type?: string;
        value?: number;
        taxes?: { value?: number };
        ctx?: { displayName?: string };
      }>;
    };
    items?: Array<{
      quantity?: number;
      price?: number;
      bookingDate?: string;
      bookingSlot?: string;
      bookingSlotTime?: string;
      ticketAttributes?: { ticketTitle?: string; effectivePrice?: number };
    }>;
    aggregatedItemsInfo?: {
      ticketTitle?: string;
      dateDisplayTitle?: string;
      timeDisplayTitle?: string;
      ticketCountTitle?: string;
    };
    storesInfo?: Array<{ name?: string; address?: string }>;
  };
  cartKey: string;
  isFree: boolean;
  paymentAvailable: boolean;
}
```

`cart` is the live cart payload passed through as returned, with `cartKey` added - it is the same shape `create_event_cart` returns, so treat every nested field as optional. The ticket, venue, date, time, and total are also written out in the response message, which is the simplest thing to read back to the user.

Only call this for a `UPI` cart. Proceed to payment only when `paymentAvailable` is `true`; otherwise direct the user to the Swiggy app.

### Schema notes

- A compatibility lookup, not a booking step. The normal flow skips this because `create_event_cart` already returns the authoritative cart summary.
- Call this only when `create_event_cart` returned `checkoutMode=UPI`. A free cart cannot be read back through this tool.
- `paymentAvailable`: `true` means you may continue to `get_payment_options` with this `cartKey`. When it is `false`, direct the user to complete the booking in the Swiggy app.
- `cart.bill`: total payable amount, booking fee, and GST. Show the total and its breakdown and ask the user to confirm before payment. Each entry in `cart.bill.charges` carries its own amount in `value` and its tax in `taxes.value`.
- `cartId` / `cartKey`: server-side cart reference for the current authenticated session. Use it only for the immediate follow-up flow; refresh the cart if the user changes items, address, slot, or payment path.
- `billToPay`: payable/order total fields. Show these as live values and refresh the cart or order state before final placement if anything changes.
- `isFree` / `skipPayment`: Scenes payment/price indicators. Paid tickets must go through the payment flow; free tickets can be placed directly after the user confirms.
- `price`: item-level price fields. They may differ before and after coupons, variants, add-ons, or stock updates; use cart/order totals for checkout.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `get_event_cart` |
| **MCP Server** | [Scenes](https://mcp.swiggy.com/builders/docs/reference/scenes/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/scenes` |
| **Stage** | Tickets |
| **Behaviour** | read-only |

## Next in this journey →

Continue with [`get_payment_options`](https://mcp.swiggy.com/builders/docs/reference/scenes/get_payment_options.md).
