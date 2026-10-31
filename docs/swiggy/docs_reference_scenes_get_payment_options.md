# get_payment_options

> Fetch the live payment methods currently available for the cart. Use this when the user is ready to pay or asks which payment options are available.

Fetch the live payment methods currently available for the cart. Use this when the user is ready to pay or asks which payment options are available.

## Usage notes

- Call when the user has confirmed the event cart and is ready to pay, or asks which UPI apps are supported.
- Use only the methods returned by this tool; do not invent or assume a payment method that was not returned.
- After the user picks a method, call `place_event_order` with the matching arguments and the same `cartKey`.
- For UPI app payment, pass `paymentMethod="UPI"` and copy the selected method `id` into `intentApp`. For scan-QR, pass `paymentMethod="UPI"` and `generateUPIQR=true`. Event tickets cannot be paid for in cash.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "get_payment_options",
  arguments: {
    cartKey: "cart_42",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "get_payment_options",
  arguments={
    "cartKey": "cart_42",
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
      "name": "get_payment_options",
      "arguments": {
    "cartKey": "cart_42"
      }
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `addressId` | `string` | no | Food only: pass the same addressId you used for get_food_cart. It is echoed back so the payment picker can place the order directly. Recommended for Food UPI. |
| `cartKey` | `string` | **yes** | Required for Scenes: exact cartKey returned by create_event_cart. Echoed to the payment UI. |

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
  platforms?: {
    mobile?: { groupName: string; methods: PaymentMethod[] };
    desktop?: { groupName: string; methods: PaymentMethod[] };
  };
  allMethods: PaymentMethod[];
  paymentAmount?: string | null;
  placeOrderToolName: "place_event_order";
  cartKey?: string;
}

type PaymentMethod = {
  id: string;
  groupName?: string;
  displayName?: string;
  kind?: "intent" | "qr";
  iconUrl?: string;
  enabled?: boolean;
}
```

Scenes tickets are prepaid, so `allMethods` only ever contains UPI options - there is no Cash entry to select. `cartKey` is echoed back from the event cart so you can pass it straight into `place_event_order`.

### Schema notes

- Use only the methods returned in `allMethods`; do not invent or assume a payment method that was not returned.
- `platforms.mobile.methods`: UPI app options. If the user selects one, pass `paymentMethod="UPI"` and copy the selected method `id` into `intentApp` exactly.
- `platforms.desktop.methods`: scan-QR options. If the user selects scan-QR, pass `paymentMethod="UPI"` and `generateUPIQR=true`.
- There is no Cash option for event tickets, so no Cash method is ever returned.
- NPCI compliance: do not ask the user for a UPI ID or VPA. Use only the returned UPI app or scan-QR options.
- `cartKey`: server-side cart reference for the current authenticated session. Use it only for the immediate follow-up flow; refresh the cart if the user changes items, address, slot, or payment path.
- `allMethods`: live payment choices or selected payment fields for this cart/order. Offer only returned methods. Pass the payment group name in `paymentMethod` (e.g. `"UPI"`) and, for a UPI app, the selected app `id` in `intentApp` — never put an app id in `paymentMethod`.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `get_payment_options` |
| **MCP Server** | [Scenes](https://mcp.swiggy.com/builders/docs/reference/scenes/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/scenes` |
| **Stage** | Payment |
| **Behaviour** | read-only |

## Next in this journey →

Continue with [`place_event_order`](https://mcp.swiggy.com/builders/docs/reference/scenes/place_event_order.md).
