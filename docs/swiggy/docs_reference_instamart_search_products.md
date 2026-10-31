# search_products

> Search for products available at an address or guest coordinates. Returns products with variants (e.g., different pack sizes, quantities). For guest mode, pass latitude and longitude; for signed-in mode, use addressId from get_addresses. When adding a product, ALWAYS search first and ask the user w…

Search for products available at an address or guest coordinates. Returns products with variants (e.g., different pack sizes, quantities). For guest mode, pass latitude and longitude; for signed-in mode, use addressId from get_addresses. When adding a product, ALWAYS search first and ask the user which variant they want.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "search_products",
  arguments: {
    query: "biryani",
    addressId: "addr_01HXYZ",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "search_products",
  arguments={
    "query": "biryani",
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
      "name": "search_products",
      "arguments": {
    "query": "biryani",
    "addressId": "addr_01HXYZ"
      }
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `addressId` | `string` | no | Location input for signed-in searches: address ID from get_addresses. Guest searches omit this and pass latitude + longitude instead. Do not invent addressId values. |
| `latitude` | `number` | no | Guest mode: delivery latitude (-90 to 90). |
| `longitude` | `number` | no | Guest mode: delivery longitude (-180 to 180). |
| `query` | `string` | **yes** | REQUIRED: Search query (product name, category, or brand). Cannot be empty. |
| `offset` | `number` | no | Pagination offset (default: 0) |

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
  nextOffset: string;
  products: SearchProduct[];
  similarProducts?: SearchProduct[];
}

type SearchProduct = {
  displayName: string;
  brand: string;
  inStock: boolean;
  isAvail: boolean;
  productId: string;
  parentProductId: string;
  isPromoted?: boolean;
  badges?: Array<{ type: string; text: string; backgroundColor?: string }>;
  variations: Array<{
    spinId: string;
    skuId: string;
    quantityDescription: string;
    displayName: string;
    brandName: string;
    price: { mrp: number; offerPrice: number; unitLevelPrice?: string };
    isInStockAndAvailable: boolean;
    imageUrl?: string;
    rating?: { value: string; count: string };
    sla?: { value: string; unit: string };
    vegClassifier?: string;
    maxQuantity?: number;
    maxQuantityMessage?: string;
  }>;
}
```

This schema documents the structured payload returned by `search_products`. Optional fields can vary by user state, cart state, and live Swiggy availability.

### Schema notes

- `spinId` / `skuId` / `productId` / `parentProductId`: Instamart product/SKU identifiers. Use returned SKU-level IDs from the selected product variation when updating an Instamart cart; product-level IDs identify the broader product family.
- `nextOffset`: pagination fields. Use them only to fetch or display more results from the same query/list; do not treat offsets as item IDs.
- `inStock` / `isInStockAndAvailable` / `isAvail`: live availability fields. If an item is out of stock, unserviceable, or quantity-capped, show the returned reason/message and refresh before checkout.
- `price` / `mrp` / `offerPrice`: item-level price fields. They may differ before and after coupons, variants, add-ons, or stock updates; use cart/order totals for checkout.
- `rating`: display/ranking signals. Do not use them as stable identifiers for follow-up calls.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `search_products` |
| **MCP Server** | [Instamart](https://mcp.swiggy.com/builders/docs/reference/instamart/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/im` |
| **Stage** | Discover |
| **Behaviour** | read-only |

## Next in this journey →

Continue with [`update_cart`](https://mcp.swiggy.com/builders/docs/reference/instamart/update_cart.md).
