# Pay with Swiggy Money on Swiggy MCP

> Use Swiggy Money for Food and Instamart orders through MCP, when available. Select Swiggy Money from the available payment options and confirm your order to pay using your Swiggy Money balance.

> **Your Swiggy Money balance can now be part of your ordering conversation.** When Swiggy Money is available for your Food or Instamart order, select **Swiggy Money** from the payment options and confirm your order. Payment is taken from your Swiggy Money balance during order placement, without a UPI app handoff or QR scan.

Whether you're ordering lunch or restocking groceries, your agent can offer Swiggy Money alongside the other payment methods available for your order. You review the cart, delivery address, and total, choose how to pay, and give the go-ahead.

For builders, this fits into the existing payment journey: discover the live options with `get_payment_options`, then pass the user's selection to the order tool. The payment option is labelled **Swiggy Money**, and selecting it tells the agent to use Swiggy Money for payment.

## What changed

- **Swiggy Money in the payment options.** Swiggy Money appears in `get_payment_options` when enabled for the user. This retail payment flow does not apply to Dineout or Scenes.
- **Payment during checkout.** A successful Swiggy Money debit completes within order placement. Users do not need to open a UPI app or scan a QR code to pay with Swiggy Money.
- **The same order tools.** Use `place_food_order` for Food or `checkout` for Instamart, with `paymentMethod="SwiggyPay"`.

Availability comes from the live payment response. If Swiggy Money is missing, offer the other returned methods. Its presence is an option to pay, not a guarantee that the Swiggy Money balance is sufficient for the order.

## The journey, end to end in chat

1. **Build your cart.** Pick your food or groceries and a saved delivery address.
2. **Review the order.** Your agent shows the items, total, delivery address, and available payment options.
3. **Select Swiggy Money.** Select the option labelled **Swiggy Money** in the payment options returned by `get_payment_options`, when available.
4. **Confirm the purchase.** Your agent waits for your approval before placing the order.
5. **Get the result.** Once checkout confirms successful payment and placement, your agent shares the order confirmation.

```text
get_food_cart / get_cart
          |
          v
get_payment_options
          |
          v
Select Swiggy Money + confirm the order
          |
          v
place_food_order / checkout
    paymentMethod="SwiggyPay"
          |
          v
Successful Swiggy Money payment + order confirmation
```

Keep enough Swiggy Money balance to cover the order total. You can check your balance and add money in the Swiggy app before trying to pay.

## How to call it

Call `get_payment_options` on the relevant authenticated MCP server: Food (`/food`) or Instamart (`/im`). For Food, pass the same `addressId` used for `get_food_cart`.

```ts
// Food example: fetch the live options for the current cart.
const options = await foodClient.callTool({
  name: "get_payment_options",
  arguments: { addressId: selectedAddressId },
});
```

The structured payment data includes `swiggyMoney` when Swiggy Money is offered. Check that `swiggyMoney.available` is `true` before presenting it to the user. Display **Swiggy Money** in your interface; the API value is **`SwiggyPay`**.

After the user selects Swiggy Money and explicitly confirms the items, total, and delivery address, call the matching order tool. These are alternatives for the two services:

```ts
// Food: only after the user confirms their Food order and Swiggy Money selection.
const foodOrder = await foodClient.callTool({
  name: "place_food_order",
  arguments: {
    addressId: selectedAddressId,
    paymentMethod: "SwiggyPay",
  },
});
```

```ts
// Instamart: only after the user confirms their Instamart order and Swiggy Money selection.
const instamartOrder = await instamartClient.callTool({
  name: "checkout",
  arguments: {
    addressId: selectedAddressId,
    paymentMethod: "SwiggyPay",
  },
});
```

The examples assume an existing cart and a delivery address selected from the user's saved addresses. Do not pass `intentApp` or `generateUPIQR` for Swiggy Money. A completed Swiggy Money checkout does not need UPI payment-status polling or a separate UPI `confirm_order` step. Read the returned result before announcing success.

## If payment does not complete

Follow the outcome returned by the tool; different failures need different next steps.

- **The Swiggy Money debit is confirmed to have failed.** The order was not placed and nothing was charged. Ask the user to check their Swiggy Money balance in the Swiggy app and add money if it is short. Refresh `get_payment_options` and let them choose another available method, such as UPI or Cash on Delivery. Do not automatically retry the Swiggy Money payment.
- **The payment outcome could not be confirmed.** Ask the user to check recent orders and their Swiggy Money balance in the Swiggy app before trying again. Do not promise that nothing was charged or immediately submit another order.
- **An order exists but its Swiggy Money payment has not settled.** Share the returned order details and ask the user to check that order and their balance in the app. Do not place the order again or retry payment through the agent.

A payment error does not always mean the balance is too low. Use the tool's message to explain what happened and what the user should do next.

## What to do in your client

- **Offer live choices.** Read `swiggyMoney` from `get_payment_options`; do not hard-code Swiggy Money availability or select it automatically.
- **Keep the user in control.** Show the order total, delivery address, and chosen payment method, then wait for explicit confirmation.
- **Use the correct API value.** Send `paymentMethod="SwiggyPay"` to the appropriate order tool.
- **Confirm from the result.** Only announce a paid, placed order when the tool confirms it. Surface failures and unsettled payments clearly.

## Reference

- [Food `get_payment_options`](https://mcp.swiggy.com/builders/docs/reference/food/get_payment_options.md) — live payment choices for food delivery.
- [Food `place_food_order`](https://mcp.swiggy.com/builders/docs/reference/food/place_food_order.md) — place an order with the selected payment method.
- [Instamart `get_payment_options`](https://mcp.swiggy.com/builders/docs/reference/instamart/get_payment_options.md) — live payment choices for groceries.
- [Instamart `checkout`](https://mcp.swiggy.com/builders/docs/reference/instamart/checkout.md) — complete an Instamart order.
- Questions? Write to us: [builders@swiggy.in](mailto:builders@swiggy.in)
