# get_restaurant_menu

> Browse a restaurant's menu as a compact, paginated list of categories and dishes. Use this when the user wants to explore what a restaurant offers or see more menu options. The browse view is intentionally compact; to order an item or inspect its full customizations, use search_menu with the item n…

Browse a restaurant's menu as a compact, paginated list of categories and dishes. Use this when the user wants to explore what a restaurant offers or see more menu options. The browse view is intentionally compact; to order an item or inspect its full customizations, use `search_menu` with the item name and `restaurantId`.

Provide a location as either an `addressId` (from `get_addresses`) or a `latitude`/`longitude` pair - one of the two is required alongside `restaurantId`.

The response is paginated over **categories**, not dishes: each call returns one page of categories (default 5 per page, max 8). Each category carries up to 10 dishes plus `totalItems` / `hasMoreItems` flags telling you when a category has more items than shown. Nested categories are returned with a `subcategories[]` array.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "get_restaurant_menu",
  arguments: {
    restaurantId: "rest_42",
    addressId: "addr_01HXYZ",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "get_restaurant_menu",
  arguments={
    "restaurantId": "rest_42",
    "addressId": "addr_01HXYZ",
  },
)
```

**curl**
```bash
curl -X POST https://mcp.swiggy.com/food \
  -H "Authorization: Bearer $SWIGGY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_restaurant_menu",
      "arguments": {
    "restaurantId": "rest_42",
    "addressId": "addr_01HXYZ"
      }
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `addressId` | `string` | no | Optional location input: address ID from get_addresses. Use this instead of latitude/longitude when preferred. |
| `latitude` | `number` | no | Optional location input: user latitude. Pass together with longitude. Supported for authenticated and guest calls. |
| `longitude` | `number` | no | Optional location input: user longitude. Pass together with latitude. Supported for authenticated and guest calls. |
| `restaurantId` | `string` | **yes** | Restaurant ID to fetch menu for (from search_restaurants) |
| `page` | `number` | no | Page number for pagination (default: 1) |
| `pageSize` | `number` | no | Number of categories per page (default: 5, max: 8) |

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
  restaurant: {
    id: string;
    name: string;
    city?: string;
    areaName?: string;
    cuisines?: string[];
    avgRating?: number;
    avgRatingString?: string;
    totalRatingsString?: string;
    costForTwoMessage?: string;
    isOpen?: boolean;
    deliveryTime?: number;
    slaString?: string;
    address?: string;
    imageUrl?: string;
  };
  categories: Array<MenuCategory | MenuNestedCategory>;
  totalCategories: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

type MenuCategory = {
  title: string;
  categoryId?: string;
  imageUrl?: string;
  totalItems?: number;
  hasMoreItems?: boolean;
  items: Array<{ id: string; name: string; description?: string; price?: number; inStock?: number; isVeg?: boolean; isBestseller?: boolean; rating?: string; imageUrl?: string; hasVariants?: boolean; hasAddons?: boolean }>;
}

type MenuNestedCategory = {
  title: string;
  categoryId?: string;
  imageUrl?: string;
  subcategories: MenuCategory[];
  totalSubcategories?: number;
}
```

This schema documents the structured payload returned by `get_restaurant_menu`. Optional fields can vary by user state, cart state, and live Swiggy availability.

### Schema notes

- Pagination is over **categories**, not dishes. The response returns one page of categories; `hasMore: true` means more category pages exist - call again with `page + 1`. The `message` field also includes the suggested next page (e.g. `Use page=2 to see more`).
- Each category returns at most **10 dishes**. When `hasMoreItems: true`, the category holds `totalItems` dishes in total but only the first 10 are shown; use `search_menu` for a specific dish beyond the cap.
- Nested categories (`Parent/Sub`) return a `subcategories[]` array, capped at 5 subcategories per nested category, with `totalSubcategories` reporting the true count.
- `page` / `pageSize`: echo back the applied pagination values (`pageSize` is clamped to the 8-category maximum).
- `description` / `imageUrl`: truncated from the compact browse view. Use `search_menu` when ordering to retrieve full item details and customizations.
- `inStock`: live availability fields. If an item is out of stock, unserviceable, or quantity-capped, show the returned reason/message and refresh before checkout.
- `price`: item-level price fields. They may differ before and after coupons, variants, add-ons, or stock updates; use cart/order totals for checkout.
- `rating` / `avgRating` / `costForTwoMessage` / `avgRatingString` / `totalRatingsString`: display/ranking signals. Do not use them as stable identifiers for follow-up calls.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `get_restaurant_menu` |
| **MCP Server** | [Swiggy Food](https://mcp.swiggy.com/builders/docs/reference/food/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/food` |
| **Stage** | Discover |
| **Behaviour** | read-only |

## Next in this journey →

Continue with [`update_food_cart`](https://mcp.swiggy.com/builders/docs/reference/food/update_food_cart.md).
