# search_restaurants

> Search and order food from restaurants for delivery. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to order food, get food delivered, or search restaurants for delivery. Swiggy Food delivery service. NOT for restaurant reservations or dine-out.

Search and order food from restaurants for delivery. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to order food, get food delivered, or search restaurants for delivery. Swiggy Food delivery service. NOT for restaurant reservations or dine-out.

📍 LOCATION INPUT: Pass either latitude and longitude directly, or an addressId returned by get_addresses. Coordinates are supported for both authenticated and guest calls; guests should not call get_addresses.

IMPORTANT: Each restaurant in the response includes an "availabilityStatus" field with values "OPEN", "CLOSED", or "UNAVAILABLE". Always check this status before proceeding: only recommend or add items from restaurants with availabilityStatus "OPEN". If a restaurant is "CLOSED" or "UNAVAILABLE", inform the user and suggest open alternatives from the results.

After showing results, let the user pick a restaurant before searching the menu. Do NOT automatically call search_menu — wait for the user to choose.

IMPORTANT: When user asks for more options or different dishes after seeing search_menu results, first call get_restaurant_menu to discover available menu categories at the restaurant. Then call search_menu with a different category/dish name to show fresh results. Do NOT re-run search_menu with the exact same query — it will return identical results.

DISTANCE & RELEVANCE: Results are sorted by a mix of distance, rating, and relevance. Each restaurant has a "distanceKm" field. When presenting results in text: (1) Prioritize nearby restaurants with good ratings first, (2) Always mention distance for far restaurants so the user can decide — e.g. "Biryani House (8.2 km away, ~40 min delivery)", (3) Never silently recommend a far restaurant without mentioning distance and expected delivery time.

GENERIC QUERIES: When user asks generic things like "popular restaurants", "best food", "what should I eat", "suggest something" — the search API handles natural language queries with query understanding. Search with broad cuisine terms like "biryani", "pizza", "chinese", "thali" based on meal time (lunch → thali/biryani/rice, dinner → similar, snack → rolls/momos/sandwich, late night → pizza/burger). Present a curated mix of top-rated nearby options across cuisines rather than dumping raw results.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "search_restaurants",
  arguments: {
    query: "biryani",
    addressId: "addr_01HXYZ",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "search_restaurants",
  arguments={
    "query": "biryani",
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
      "name": "search_restaurants",
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
| `addressId` | `string` | no | Optional location input: address ID obtained from get_addresses. Use this instead of latitude/longitude when preferred. |
| `latitude` | `number` | no | Optional location input: user latitude. Pass together with longitude. Supported for authenticated and guest calls. |
| `longitude` | `number` | no | Optional location input: user longitude. Pass together with latitude. Supported for authenticated and guest calls. |
| `query` | `string` | **yes** | REQUIRED: Search query (restaurant name or cuisine). Cannot be empty. Examples: "pizza", "biryani", "KFC" |
| `offset` | `number` | no | Pagination offset. Use nextOffset from previous response to load more results. Default: 0. |

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
  restaurants: Array<{
    id?: string;
    name: string;
    cuisines: string[];
    avgRating?: number;
    totalRatings?: string;
    costForTwo?: string;
    areaName?: string;
    distanceKm?: number;
    deliveryTimeMinutes?: number;
    deliveryTimeRange?: string;
    veg?: boolean;
    offer?: string;
    imageUrl?: string;
    availabilityStatus?: string;
    nextOpenTime?: string;
  }>;
  dishes: Array<{
    id?: string;
    name: string;
    price?: number;
    isVeg?: boolean;
    description?: string;
    imageUrl?: string;
    category?: string;
    inStock?: boolean;
    restaurantId?: string;
    restaurantName?: string;
    restaurantRating?: number;
    restaurantAreaName?: string;
    deliveryTimeMinutes?: number;
  }>;
  nextOffset?: string | number;
  query: string;
  totalRestaurants?: number;
  hasMore?: boolean;
}
```

This schema documents the structured payload returned by `search_restaurants`. Optional fields can vary by user state, cart state, and live Swiggy availability.

### Schema notes

- `restaurantId`: Swiggy restaurant identifier. On a restaurant result the identifier is `id` (e.g. `restaurants[].id`); `dishes[].restaurantId` is the distinct restaurant id carried on a dish. Preserve whichever you use exactly for menu, cart, slot, booking, and order follow-up calls.
- `nextOffset` / `hasMore`: pagination fields. Use them only to fetch or display more results from the same query/list; do not treat offsets as item IDs.
- `inStock`: live availability fields. If an item is out of stock, unserviceable, or quantity-capped, show the returned reason/message and refresh before checkout.
- `price`: item-level price fields. They may differ before and after coupons, variants, add-ons, or stock updates; use cart/order totals for checkout.
- `avgRating` / `totalRatings` / `costForTwo`: display/ranking signals. Do not use them as stable identifiers for follow-up calls.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `search_restaurants` |
| **MCP Server** | [Swiggy Food](https://mcp.swiggy.com/builders/docs/reference/food/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/food` |
| **Stage** | Discover |
| **Behaviour** | read-only |

## Next in this journey →

Continue with [`get_restaurant_menu`](https://mcp.swiggy.com/builders/docs/reference/food/get_restaurant_menu.md).
