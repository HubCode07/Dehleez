# get_addresses

> 📄 PAGINATION: Results are returned one page at a time (10 addresses per page). The response includes a "pagination" object (&#123; page, pageSize, total, totalPages, hasMore &#125;). If hasMore is true and the user has not found the address they want, call this tool again with the next page number…

📄 PAGINATION: Results are returned one page at a time (10 addresses per page). The response includes a "pagination" object (&#123; page, pageSize, total, totalPages, hasMore &#125;). If hasMore is true and the user has not found the address they want, call this tool again with the next page number (e.g. page=2) to fetch more.

📍 RESOLUTION WORKFLOW:
1. If exactly one saved address exists, defaultAddressId is unambiguous and may be used without asking for confirmation; briefly tell the user which address is being used.
2. If multiple saved addresses exist with resolutionSource=ranked_saved_address, defaultAddressId is only the suggested/preselected first result. Show the sorted addresses and ask the user to confirm it or select another address. Do not call downstream tools yet.
3. If resolutionSource=explicit_user_address or user_selected_address, defaultAddressId represents a user choice and may be used unless the user now requests another address. Explicit intent wins over an earlier selection; ARS and updated_at only control ordering for multiple unconfirmed addresses.
4. Only if data.pagination.total === 0, inform the user that they need to add an address first. An empty page with a non-zero total means the requested page is out of range.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "get_addresses",
  arguments: {
    selectedAddressId: "...",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "get_addresses",
  arguments={
    "selectedAddressId": "...",
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
      "name": "get_addresses",
      "arguments": {
    "selectedAddressId": "..."
      }
    },
    "id": 1
  }'
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | `number` | no | Page number for pagination, 1-based (default: 1) |
| `pageSize` | `number` | no | Number of addresses per page (default: 10, max: 10) |
| `explicitAddressId` | `string` | no | Optional saved address ID requested in the current user turn. It takes precedence over selectedAddressId; use only an ID previously returned by get_addresses. |
| `selectedAddressId` | `string` | no | Optional saved address ID selected earlier in this conversation/UI flow. Used for continuity only when the current turn has no explicit address request. |
| `latitude` | `number` | no | Optional current latitude supplied by the client context. Pass only when the client provides it; never infer it or ask the user to type it. Must be paired with longitude. |
| `longitude` | `number` | no | Optional current longitude supplied by the client context. Pass only when the client provides it; never infer it or ask the user to type it. Must be paired with latitude. |

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
  addresses: Array<{
    id: string;
    addressLine: string;
    phoneNumber: string;
    addressCategory?: string;
    addressTag?: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  resolution: {
    defaultAddressId?: string;
    resolutionSource: "explicit_user_address" | "user_selected_address" | "ranked_saved_address" | "requested_address_not_found" | "no_saved_address";
    needsUserClarification: boolean;
    candidateAddressIds: string[];
    scoreUsed?: number;
  };
}
```

This schema documents the structured payload returned by `get_addresses`. Optional fields can vary by user state, cart state, and live Swiggy availability.

### Schema notes

- `id`: stable identifier for a saved Swiggy delivery address. Use the returned ID in cart, checkout, and payment calls instead of reusing the human-readable address text.
- `hasMore` / `page` / `pageSize` / `totalPages`: pagination fields. Use them only to fetch or display more results from the same query/list; do not treat page numbers as item IDs.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `get_addresses` |
| **MCP Server** | [Swiggy Food](https://mcp.swiggy.com/builders/docs/reference/food/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/food` |
| **Stage** | Discover |
| **Behaviour** | read-only |

## Next in this journey →

Continue with [`search_restaurants`](https://mcp.swiggy.com/builders/docs/reference/food/search_restaurants.md).
