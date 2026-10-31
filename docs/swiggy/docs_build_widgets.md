# Widgets

> Render-ready UI fragments that Swiggy MCP servers can return alongside tool responses.

Not every AI client wants to render restaurant cards, menu items, and carts from scratch. Widgets are the plan for letting Swiggy ship pre-built UI fragments a chat client can embed directly.

> **Note**
>
> Widgets are served **inline over MCP**, not from an HTTP hosting layer. There is **no** `mcp.swiggy.com/widgets/...` URL, **no** `X-Swiggy-Widgets` request header, **no** `?theme=` parameter, and **no** top-level `widgets` array on tool responses. Instead, widget-capable clients fetch widget HTML through the standard MCP `resources/list` + `resources/read` calls, and each widget-backed tool points to its UI via `_meta.ui.resourceUri`. Clients without widget support simply render their own UI from the `data` payload.

## How widgets are delivered

A widget is an **iframe-embeddable HTML document** exposed as an **MCP resource** under a `ui://widget/...` URI (e.g. `ui://widget/im-cart.html`). It is delivered over the MCP protocol, not a public URL:

1. A widget-backed tool advertises its UI on the tool definition as `_meta.ui.resourceUri`.
2. A widget-capable client calls **`resources/list`** to discover available widgets, then **`resources/read`** with the `resourceUri` to fetch the HTML (returned as the resource's `text`, with CSP metadata under `_meta.ui`).
3. The client renders that HTML in a sandboxed iframe, hydrating it from the tool's `data`.

```json
{
  "_meta": { "ui": { "resourceUri": "ui://widget/im-cart.html" } }
}
```

Clients that don't support widgets ignore `_meta.ui` and render their own UI from the standard tool response envelope (`success`, `data`, and an optional `message`). The `data` payload is tool-specific and carries everything you semantically need.

## Current state by server

| Server | Widget registry |
| --- | --- |
| Food | Flagged `hasWidgets: true`; widget resources registered server-side |
| Instamart | Flagged `hasWidgets: true` |
| Dineout | Flagged `hasWidgets: true` |
| Scenes | Flagged `hasWidgets: true` |

For every widget-enabled server, widget HTML is served over MCP `resources/read` (keyed by the `ui://widget/...` URIs the tools advertise). What does **not** exist is a public HTTP hosting layer or hosted widget URLs.

If you use voice or TTS surfaces, widgets don't help - stick to text responses derived from `data`. Widgets are a chat-surface concept (Claude, ChatGPT, Cursor, custom web chat).

## Render from `data`

If your client doesn't support MCP widget resources, build your own UI from the `data` envelope. It contains the structured fields (restaurant, menu item, cart, slot, event) you need:

```tsx
// Illustrative only — field names below follow the search_restaurants `data`
// payload (see /docs/reference/food/search_restaurants). For search_restaurants,
// the list is under `data.restaurants`.
function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <article>
      {restaurant.imageUrl && <img src={restaurant.imageUrl} alt={restaurant.name} />}
      <h3>{restaurant.name}</h3>
      <p>{restaurant.avgRating ?? "—"} · {restaurant.deliveryTimeMinutes ?? "—"} min</p>
      {restaurant.id && <button onClick={() => openMenu(restaurant.id)}>View menu</button>}
    </article>
  );
}
```

This keeps your integration fully under your control, independent of whether your client renders the MCP widget resources.
