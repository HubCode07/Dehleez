# Instamart

> Swiggy Instamart MCP Server - Your AI-powered grocery and essentials shopping assistant. Get everything delivered in minutes — from fresh fruits, vegetables, dairy, and staples to snacks, beverages, …

Swiggy Instamart MCP Server - Your AI-powered grocery and essentials shopping assistant. Get everything delivered in minutes — from fresh fruits, vegetables, dairy, and staples to snacks, beverages, personal care, electronics, baby care, pet supplies, and more. Browse a wide variety of products across 50+ categories, enjoy great deals, manage your cart, and place orders with quick delivery right to your doorstep.

- **Endpoint**: `POST mcp.swiggy.com/im`
- **Tools available**: 20

## Tools by stage

### Discover

| Tool | Description |
| --- | --- |
| [`create_address`](https://mcp.swiggy.com/builders/docs/reference/instamart/create_address.md) | Swiggy (Instamart/Food): Create a new delivery address for the authenticated user. |
| [`delete_address`](https://mcp.swiggy.com/builders/docs/reference/instamart/delete_address.md) | Swiggy (Instamart/Food): Delete a saved delivery address for the authenticated user. |
| [`get_addresses`](https://mcp.swiggy.com/builders/docs/reference/instamart/get_addresses.md) | 📄 PAGINATION: Results are returned one page at a time (10 addresses per page). The response includes a "pagination" object (&#123; page, pageSi… |
| [`search_products`](https://mcp.swiggy.com/builders/docs/reference/instamart/search_products.md) | Search for products available at an address or guest coordinates. Returns products with variants (e.g., different pack sizes, quantities). … |
| [`your_go_to_items`](https://mcp.swiggy.com/builders/docs/reference/instamart/your_go_to_items.md) | Fetch the user's Your Go To Items (frequently or recently ordered items) for the selected delivery address. Use addressId from get_addresse… |

### Cart

| Tool | Description |
| --- | --- |
| [`apply_coupon`](https://mcp.swiggy.com/builders/docs/reference/instamart/apply_coupon.md) | Swiggy Instamart (Grocery): Apply a coupon code to the current Instamart cart. Returns the updated cart with the discount reflected in the … |
| [`clear_cart`](https://mcp.swiggy.com/builders/docs/reference/instamart/clear_cart.md) | Clear (remove all items from) the Instamart cart. Authentication is handled automatically. |
| [`get_cart`](https://mcp.swiggy.com/builders/docs/reference/instamart/get_cart.md) | Swiggy Instamart (Grocery): Get current Swiggy Instamart grocery cart with all items and bill breakdown. Use this for Instamart grocery ord… |
| [`list_coupons`](https://mcp.swiggy.com/builders/docs/reference/instamart/list_coupons.md) | Swiggy Instamart (Grocery): List available coupons for the current cart. Fetches applicable coupon offers based on the items in your cart a… |
| [`update_cart`](https://mcp.swiggy.com/builders/docs/reference/instamart/update_cart.md) | Swiggy Instamart (Grocery): Update the cart with items. Replaces the entire cart. Signed-in users use selectedAddressId; guest users use la… |

### Payment

| Tool | Description |
| --- | --- |
| [`check_payment_status`](https://mcp.swiggy.com/builders/docs/reference/instamart/check_payment_status.md) | Check one payment-status iteration for an in-flight UPI payment. Use the returned terminal flags and message to decide whether to stop poll… |
| [`confirm_order`](https://mcp.swiggy.com/builders/docs/reference/instamart/confirm_order.md) | Complete an order after payment succeeds. For UPI flows, the place-order tool first returns `PENDING_PAYMENT`; call this only after `check_… |
| [`get_payment_options`](https://mcp.swiggy.com/builders/docs/reference/instamart/get_payment_options.md) | Fetch the live payment methods currently available for the cart. Use this when the user is ready to pay or asks which payment options are a… |

### Order

| Tool | Description |
| --- | --- |
| [`checkout`](https://mcp.swiggy.com/builders/docs/reference/instamart/checkout.md) | Swiggy Instamart (Grocery): Place and confirm Swiggy Instamart grocery order. Creates order and confirms payment in a single operation. Use… |

### Track

| Tool | Description |
| --- | --- |
| [`get_delivery_status`](https://mcp.swiggy.com/builders/docs/reference/instamart/get_delivery_status.md) | Get the latest delivery ETA and status for an Instamart order. |
| [`get_order_details`](https://mcp.swiggy.com/builders/docs/reference/instamart/get_order_details.md) | Get detailed information for a specific Swiggy Instamart order by order ID. Use this when the user wants to see complete details about a sp… |
| [`get_orders`](https://mcp.swiggy.com/builders/docs/reference/instamart/get_orders.md) | Swiggy Instamart order history - Use this to fetch ORDER HISTORY, past orders, or order preferences. Use this FIRST when user asks: "show m… |
| [`track_order`](https://mcp.swiggy.com/builders/docs/reference/instamart/track_order.md) | Track Swiggy Instamart order status in real-time. PRIMARY TOOL for order tracking - Use this FIRST when user asks: "where is my order", "tr… |

### Support

| Tool | Description |
| --- | --- |
| [`recommend_address`](https://mcp.swiggy.com/builders/docs/reference/instamart/recommend_address.md) | Swiggy: Geocode a free-text address to coordinates and a formatted address string. Use this when you have an address string and need to res… |
| [`report_error`](https://mcp.swiggy.com/builders/docs/reference/instamart/report_error.md) | Generate an error report to share with the Swiggy MCP team. Use this when the user encounters an error and wants to report it. Returns a pr… |

## Related

- [Authenticate](https://mcp.swiggy.com/builders/docs/start/authenticate.md)
- [Error codes](https://mcp.swiggy.com/builders/docs/reference/errors.md)
- [Quickstart](https://mcp.swiggy.com/builders/docs/start/developer/index.md)
