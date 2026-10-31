# confirm_order

> Complete an order after payment succeeds. For UPI flows, the place-order tool first returns PENDING_PAYMENT; call this only after check_payment_status reports a successful terminal payment and only when the order has not already been auto-confirmed.

Complete an order after payment succeeds. For UPI flows, the place-order tool first returns `PENDING_PAYMENT`; call this only after `check_payment_status` reports a successful terminal payment and only when the order has not already been auto-confirmed.

## Usage notes

- Use this after `check_payment_status` reports a successful terminal payment and does not report `confirmed=true`.
- Clients that render the payment UI normally confirm automatically after a successful payment. Do not call this again if the status response says the order was confirmed already.
- Do not call this for failed, cancelled, or refund-initiated payment statuses.
- Scenes confirmation requires `orderId` and the `paasId` returned by `place_event_order`.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "confirm_order",
  arguments: {
    orderId: "ord_42",
    paasId: "paas_42",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "confirm_order",
  arguments={
    "orderId": "ord_42",
    "paasId": "paas_42",
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
      "name": "confirm_order",
      "arguments": {
    "orderId": "ord_42",
    "paasId": "paas_42"
      }
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `orderId` | `string` | **yes** | Order ID returned by the place-order tool. |
| `transactionId` | `string` | no | Transaction ID returned by the place-order tool (Instamart, Dineout, and Scenes). |
| `paasId` | `string` | **yes for Scenes** | Payment transaction ID returned by the place-order tool (Instamart, Dineout, and Scenes). |
| `addressId` | `string` | no | Food only; not used by Scenes confirmation. |
| `cartId` | `string` | no | Food only; not used by Scenes confirmation. |
| `lat` | `number` | no | Food only; not used by Scenes confirmation. |
| `lng` | `number` | no | Food only; not used by Scenes confirmation. |

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
  orderId: string;
  paasId?: string;
  orderStatus?: string;
  result:
    | "success"
    | "failed"
    | "cancelled"
    | "cart_changed"
    | "refund_initiated"
    | "retry";
}
```

This schema documents the structured payload returned by `confirm_order`. Optional fields can vary by user state, cart state, and live Swiggy availability.

### Schema notes

- Call only after a successful terminal payment status, and only when the order was not already auto-confirmed.
- `result`: `success` means the ticket is booked. `failed`, `cancelled`, and `refund_initiated` are final - do not retry the same payment. `cart_changed` means the cart was repriced and the booking must be started again. `retry` means the outcome is not yet known; check the status again before telling the user anything.
- This call is idempotent for the same payment/order identifiers; retry only when the previous call failed due to a transient client or network issue.
- `orderStatus`: service state field. Prefer accompanying messages/terminal flags and refresh status before taking irreversible actions.
- `orderId`: order identifier for tracking, support, payment confirmation, and cancellation flows. Preserve formatting exactly as returned.
- `paasId`: required payment transaction identifier for Scenes confirmation. Echo it exactly from the `place_event_order` UPI response.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `confirm_order` |
| **MCP Server** | [Scenes](https://mcp.swiggy.com/builders/docs/reference/scenes/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/scenes` |
| **Stage** | Payment |
| **Behaviour** | mutating |

## Next in this journey →

Continue with [`get_event_booking_status`](https://mcp.swiggy.com/builders/docs/reference/scenes/get_event_booking_status.md).
