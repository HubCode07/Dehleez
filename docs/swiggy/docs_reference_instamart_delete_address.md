# delete_address

> Swiggy (Instamart/Food): Delete a saved delivery address for the authenticated user.

Swiggy (Instamart/Food): Delete a saved delivery address for the authenticated user.

📍 WORKFLOW:
1. First call get_addresses to show the user their saved addresses
2. Ask the user which address they want to delete
3. Get the addressId from the user's selection
4. Call this tool with the addressId

⚠️ WARNING: This action is permanent and cannot be undone. Always confirm with the user before deleting.

## Example

**TypeScript**
```ts
const result = await client.callTool({
  name: "delete_address",
  arguments: {
    addressId: "addr_01HXYZ",
  },
});
```

**Python**
```py
result = await session.call_tool(
  "delete_address",
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
      "name": "delete_address",
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
| `addressId` | `string` | **yes** | The ID of the address to delete (from get_addresses response) |

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
  statusCode: number;
  statusMessage: string;
}
```

This schema documents the structured payload returned by `delete_address`. Optional fields can vary by user state, cart state, and live Swiggy availability.

### Schema notes

- `statusCode` / `statusMessage`: service state fields. Prefer accompanying messages/terminal flags and refresh status before taking irreversible actions.
- Fields marked optional may be omitted depending on user state, cart/order state, and live Swiggy availability.
- Use returned identifiers and enum values exactly as provided; do not invent fallback IDs, status values, payment methods, or timestamps.

## Details

| Field | Value |
| --- | --- |
| **Name** | `delete_address` |
| **MCP Server** | [Instamart](https://mcp.swiggy.com/builders/docs/reference/instamart/index.md) |
| **Endpoint** | `POST mcp.swiggy.com/im` |
| **Stage** | Discover |
| **Behaviour** | mutating |

## Next in this journey →

Continue with [`get_addresses`](https://mcp.swiggy.com/builders/docs/reference/instamart/get_addresses.md).
