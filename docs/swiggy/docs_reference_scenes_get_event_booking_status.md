# get_event_booking_status

> Scenes (Events & Shows): Check the status of an event ticket booking after payment is confirmed. Call this after check_payment_status reports a successful terminal payment. Returns the final booking details: venue, date, time, guest count, and order ID.

Scenes (Events & Shows): Check the status of an event ticket booking after payment is confirmed. Call this after check_payment_status reports a successful terminal payment. Returns the final booking details: venue, date, time, guest count, and order ID. 

Required: orderId (from place_event_order response).

## Usage notes

- Use this after payment succeeds, or when a free booking came back as still processing.
- The booking details are returned under `booking` rather than `data`.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "get_event_booking_status",
  arguments: {
    orderId: "ord_42",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "get_event_booking_status",
  arguments={
    "orderId": "ord_42",
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
      "name": "get_event_booking_status",
      "arguments": {
    "orderId": "ord_42"
      }
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `orderId` | `string` | **yes** | Order ID from the booking confirmation. |

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
booking: {
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLocation?: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  dealTitle: string;
  status: string;
  bill?: {
    subTotal: number;
    totalBillAmount: number;
    charges: Array<{ name: string; totalCost: number }>;
    taxes: Array<{ name: string; totalCost: number }>;
    discounts: Array<{ name: string; totalCost: number }>;
  };
}
```

This tool returns the confirmation under `booking` rather than `data`, so clients that read only `data` will see nothing. Read `booking` for the venue, date, time, guest count, and bill breakdown.

### Schema notes

- The confirmation is returned under `booking`, not `data`.
- `status`: a `PROCESSING` value means the booking is not final yet. Wait and check again rather than reporting it as confirmed.
- `bill`: itemised amounts for the booking, when the service provides them.
- `restaurantName` / `restaurantLocation`: the venue hosting the show. `reservationDate`, `reservationTime`, and `guestCount` are the show date, show time, and ticket count.
- `orderId`: order identifier for tracking and support. Preserve formatting exactly as returned.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `get_event_booking_status` |
| **MCP Server** | [Scenes](https://mcp.swiggy.com/builders/docs/reference/scenes/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/scenes` |
| **Stage** | Booking |
| **Behaviour** | read-only |
