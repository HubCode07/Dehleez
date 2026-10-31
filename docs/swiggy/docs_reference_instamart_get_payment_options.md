# get_payment_options

> Fetch the live payment methods currently available for the cart. Use this when the user is ready to pay or asks which payment options are available.

Fetch the live payment methods currently available for the cart. Use this when the user is ready to pay or asks which payment options are available.

## Usage notes

- Call when the user is ready to pay, asks what payment methods are available, or mentions UPI apps such as GPay, PhonePe, or Paytm.
- Use only the methods returned by this tool; do not invent or assume a payment method that was not returned.
- For Instamart, call this when payment is needed; do not assume the cart response contains the full live UPI payment list.
- After the user picks a method, hand off to the domain place-order tool: `checkout` for Instamart, `place_food_order` for Food, or `book_table` for Dineout.
- For UPI app payment, pass `paymentMethod="UPI"` and copy the selected method `id` into `intentApp`. For scan-QR, pass `paymentMethod="UPI"` and `generateUPIQR=true`. For Cash/COD, pass the returned Cash/COD method.
- For Swiggy Money, pass `paymentMethod="SwiggyPay"` to `checkout` (no `intentApp`, no `generateUPIQR`). Do not assume Swiggy Money is available — only offer it when this tool returns the `swiggyMoney` option.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "get_payment_options",
  arguments: {
    addressId: "addr_01HXYZ",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "get_payment_options",
  arguments={
    "addressId": "addr_01HXYZ",
  },
)
```

**curl**
```bash
curl -X POST https://mcp.swiggy.com/im \
  -H "Authorization: Bearer $SWIGGY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_payment_options",
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
| `addressId` | `string` | no | Food only: pass the same addressId you used for get_food_cart. It is echoed back so the payment picker can place the order directly. Recommended for Food UPI. |

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
data: PaymentOptionsView

type PaymentOptionsView = {
  platforms?: {
    mobile?: { groupName: string; methods: PaymentMethod[] };
    desktop?: { groupName: string; methods: PaymentMethod[] };
  };
  cod?: { available: boolean; id: string; displayName: string };
  swiggyMoney?: { available: boolean; id: string; displayName: string };
  reservePay?: { available: boolean; id: string; displayName: string };
  agenticPaymentEligible: boolean;
  allMethods: PaymentMethod[];
  paymentAmount?: string | null;
  placeOrderToolName: "checkout";
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

This schema documents the structured payload returned by `get_payment_options`. Optional fields can vary by user state, cart state, and live Swiggy availability.

### Schema notes

- Use only the methods returned in `allMethods`; do not invent or assume a payment method that was not returned.
- `platforms.mobile.methods`: UPI app options. If the user selects one, pass `paymentMethod="UPI"` and copy the selected method `id` into `intentApp` exactly.
- `platforms.desktop.methods`: scan-QR options. If the user selects scan-QR, pass `paymentMethod="UPI"` and `generateUPIQR=true`.
- `cod`: Cash/COD option, when available.
- `swiggyMoney`: the Swiggy Money payment method, when offered for retail Instamart. Show it alongside the other returned payment methods when `available` is true. On selection and order confirmation, pass `paymentMethod="SwiggyPay"` to `checkout` without `intentApp` or `generateUPIQR`. See the Swiggy Money section below for the flow and payment outcomes.
- NPCI compliance: do not ask the user for a UPI ID or VPA. Use only the returned UPI app or scan-QR options.
- `allMethods`: live payment choices or selected payment fields for this cart/order. Offer only returned methods. Pass the payment group name in `paymentMethod` (e.g. `"UPI"`) and, for a UPI app, the selected app `id` in `intentApp` — never put an app id in `paymentMethod`.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Swiggy Money

Swiggy Money lets users pay for their Instamart order using their Swiggy Money balance. Show **Swiggy Money** alongside the other available payment methods returned by this tool. The user selects **Swiggy Money** directly from these payment options. This tool only lists payment choices; it does not take payment or place an order. Payment happens when the user confirms their order and you call [`checkout`](https://mcp.swiggy.com/builders/docs/reference/instamart/checkout.md).

### Check availability

Offer Swiggy Money only when the live response includes `swiggyMoney` with `available: true`. If it is absent or unavailable, show the other returned methods. Availability does not guarantee that the Swiggy Money balance covers the order total; users can check their balance and add money in the Swiggy app.

The following is an illustrative response excerpt, limited to the Swiggy Money fields. Other available methods may also appear in the full response.

```json
{
  "success": true,
  "data": {
    "swiggyMoney": {
      "available": true,
      "id": "SwiggyPay",
      "displayName": "Swiggy Money"
    },
    "allMethods": [
      {
        "id": "SwiggyPay",
        "groupName": "SWIGGYPAY",
        "displayName": "Swiggy Money"
      }
    ],
    "placeOrderToolName": "checkout"
  }
}
```

| Field | How to use it |
| --- | --- |
| `swiggyMoney.available` | Offer Swiggy Money only when this is `true`. |
| `swiggyMoney.displayName` | Show **Swiggy Money** to the user. |
| `swiggyMoney.id` | Use `SwiggyPay` as the selected `paymentMethod`. |
| `allMethods` | The live list of payment choices, including Swiggy Money when offered. |

### Pay with Swiggy Money

1. Fetch `get_cart` and show the items, total, and selected delivery address.
2. Call `get_payment_options` for the live payment choices.
3. Let the user select **Swiggy Money** from the returned payment options, then wait for explicit confirmation of the order and payment method.
4. Call `checkout` with `paymentMethod="SwiggyPay"` and the selected saved address ID.

```ts
// Only after Swiggy Money is offered, selected, and the user confirms.
const result = await client.callTool({
  name: "checkout",
  arguments: {
    addressId: selectedAddressId,
    paymentMethod: "SwiggyPay",
  },
});
```

Do not send `intentApp` or `generateUPIQR` for Swiggy Money payments. On successful checkout, the Swiggy Money balance is debited during order placement, without a UPI app handoff or QR scan. A completed Swiggy Money order needs no UPI payment-status polling or separate `confirm_order` call. Announce success only after the tool confirms successful payment and order placement.

### If payment does not complete

- **Confirmed debit failure:** the order was not placed and nothing was charged. Ask the user to check their balance in the Swiggy app and top up if needed. Refresh `get_payment_options` and offer another returned method, such as UPI or Cash/COD. Do not retry Swiggy Money until the user has topped up and confirmed another attempt.
- **Payment outcome unknown:** do not claim that nothing was charged. Ask the user to check recent orders and their Swiggy Money balance in the Swiggy app before trying again, to avoid paying twice.
- **An order exists but payment is unsettled:** share the returned order details and ask the user to check the order and Swiggy Money balance in the app. Do not place another order or retry payment through the agent.

Follow the returned error message; not every payment failure means the balance is too low.

## Details

| Field | Value |
| --- | --- |
| **Name** | `get_payment_options` |
| **MCP Server** | [Instamart](https://mcp.swiggy.com/builders/docs/reference/instamart/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/im` |
| **Stage** | Payment |
| **Behaviour** | read-only |

## Next in this journey →

Continue with [`checkout`](https://mcp.swiggy.com/builders/docs/reference/instamart/checkout.md).
