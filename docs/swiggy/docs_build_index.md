# Build

> Recipes and patterns for shipping agents that use Swiggy MCP.

You're past the quickstart - your agent can call `get_addresses`. Now build the thing. This tab is the practical half of the docs: end-to-end journeys, agent patterns, widgets, and go-live.

## Recipes

End-to-end journeys you can paste into an agent today.

- [Order food end-to-end](https://mcp.swiggy.com/builders/docs/build/recipes/order-food.md) - 7-tool Food journey, COD payment, tracking.
- [Order groceries end-to-end](https://mcp.swiggy.com/builders/docs/build/recipes/order-groceries.md) - Instamart discover → cart → checkout → track.
- [Pay with UPI end-to-end](https://mcp.swiggy.com/builders/docs/build/recipes/pay-with-upi.md) - the shared Payment stage: picker → paid order → confirm, on any server.
- [Book a table](https://mcp.swiggy.com/builders/docs/build/recipes/book-a-table.md) - Dineout availability + reservation.
- [Plan my evening (combined)](https://mcp.swiggy.com/builders/docs/build/recipes/combined.md) - Food + Dineout in one agent turn.

## Agent patterns

How to shape Swiggy MCP into agents that don't embarrass themselves in production.

- [Voice vs chat](https://mcp.swiggy.com/builders/docs/build/agent-patterns/voice-vs-chat.md) - different response contracts for TTS and rich-card surfaces.
- [Multi-turn cart state](https://mcp.swiggy.com/builders/docs/build/agent-patterns/multi-turn-state.md) - carrying cart identity across turns on a stateless protocol.

## Surfaces

- [Widgets](https://mcp.swiggy.com/builders/docs/build/widgets.md) - MCP-UI fragments (restaurant cards, menu items, cart widgets) that agents can hand back to chat clients for rendering.

## Ship

- [Ship to production](https://mcp.swiggy.com/builders/docs/build/ship-to-production.md) - retries, observability, the go-live checklist.
