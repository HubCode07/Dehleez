# update_cart

> Swiggy Instamart (Grocery): Update the cart with items. Replaces the entire cart. Signed-in users use selectedAddressId; guest users use latitude and longitude. Pass skuId, spinId, and quantity from search_products.

Swiggy Instamart (Grocery): Update the cart with items. Replaces the entire cart. Signed-in users use selectedAddressId; guest users use latitude and longitude. Pass skuId, spinId, and quantity from search_products.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "update_cart",
  arguments: {
    items: [{ "spinId": "spin_42", "skuId": "sku_88", "quantity": 1 }],
    selectedAddressId: "...",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "update_cart",
  arguments={
    "items": [{ "spinId": "spin_42", "skuId": "sku_88", "quantity": 1 }],
    "selectedAddressId": "...",
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
      "name": "update_cart",
      "arguments": {
    "items": [{ "spinId": "spin_42", "skuId": "sku_88", "quantity": 1 }],
    "selectedAddressId": "..."
      }
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `selectedAddressId` | `string` | no | Selected delivery address ID from get_addresses tool |
| `latitude` | `number` | no | Guest mode delivery latitude (-90 to 90). |
| `longitude` | `number` | no | Guest mode delivery longitude (-180 to 180). |
| `items` | `object[]` | **yes** | Array of items to add to cart |

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
data: InstamartCart & {
  removedOutOfStockItems?: InstamartCartItem[];
  reducedQuantityItems?: Array<{
    spinId: string;
    itemName: string;
    requestedQuantity: number;
    cappedQuantity: number;
    reason?: string;
  }>;
}
```

The base cart shape is the same as `get_cart`.

### Schema notes

- `spinId`: Instamart product/SKU identifiers. Use returned SKU-level IDs from the selected product variation when updating an Instamart cart; product-level IDs identify the broader product family.
- `reducedQuantityItems`: live availability fields. If an item is out of stock, unserviceable, or quantity-capped, show the returned reason/message and refresh before checkout.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `update_cart` |
| **MCP Server** | [Instamart](https://mcp.swiggy.com/builders/docs/reference/instamart/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/im` |
| **Stage** | Cart |
| **Behaviour** | mutating |

## Next in this journey →

Continue with [`get_cart`](https://mcp.swiggy.com/builders/docs/reference/instamart/get_cart.md).
