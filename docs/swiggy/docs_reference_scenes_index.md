# Scenes

> Swiggy Scenes MCP Server — Discover events, shows, and live performances at venues. Find show schedules, seat availability, and ticket details for events at Dineout restaurants and standalone venues.

Swiggy Scenes MCP Server — Discover events, shows, and live performances at venues. Find show schedules, seat availability, and ticket details for events at Dineout restaurants and standalone venues.

- **Endpoint**: `POST mcp.swiggy.com/scenes`
- **Tools available**: 15

## Tools by stage

### Discover

| Tool | Description |
| --- | --- |
| [`discover_events`](https://mcp.swiggy.com/builders/docs/reference/scenes/discover_events.md) | Scenes (Events & Shows): Discover events near a location. Use for ANY genre/category query ("comedy shows", "music events", "open mic in Ba… |
| [`get_event_details`](https://mcp.swiggy.com/builders/docs/reference/scenes/get_event_details.md) | Scenes (Events & Shows): Get full details for a specific event including venueId, venue name, address, upcoming date/time, and starting pri… |
| [`get_event_venue_info`](https://mcp.swiggy.com/builders/docs/reference/scenes/get_event_venue_info.md) | Scenes (Events & Shows): Lightweight venue + event metadata for an event. Returns venue name, address, location, and event metadata (title,… |
| [`get_events_collection`](https://mcp.swiggy.com/builders/docs/reference/scenes/get_events_collection.md) | Scenes (Events & Shows): Get events filtered by a specific collection, genre, or category. Use ONLY when the user picks a genre chip (Comed… |
| [`get_saved_locations`](https://mcp.swiggy.com/builders/docs/reference/scenes/get_saved_locations.md) | List the user's saved locations (addresses), ranked for selection, so you can choose which one to use. When several exist, confirm the loca… |
| [`search_events`](https://mcp.swiggy.com/builders/docs/reference/scenes/search_events.md) | Scenes (Events & Shows): Auto-suggest search for a SPECIFIC artist name or show name. Use ONLY when the user names a specific person or exa… |

### Tickets

| Tool | Description |
| --- | --- |
| [`create_event_cart`](https://mcp.swiggy.com/builders/docs/reference/scenes/create_event_cart.md) | Scenes (Events & Shows): Create a cart for a specific event show and ticket. Call this after the user has selected a show from list_event_s… |
| [`get_event_cart`](https://mcp.swiggy.com/builders/docs/reference/scenes/get_event_cart.md) | Scenes (Events & Shows): Compatibility lookup for an existing event cart. The normal flow does not call this after create_event_cart becaus… |
| [`list_event_shows`](https://mcp.swiggy.com/builders/docs/reference/scenes/list_event_shows.md) | Scenes (Events & Shows): Get detailed show listings for a specific event and venue. This is step 3 of the booking flow: discover/search → g… |

### Payment

| Tool | Description |
| --- | --- |
| [`check_payment_status`](https://mcp.swiggy.com/builders/docs/reference/scenes/check_payment_status.md) | Check one payment-status iteration for an in-flight UPI payment. Use the returned terminal flags and message to decide whether to stop poll… |
| [`confirm_order`](https://mcp.swiggy.com/builders/docs/reference/scenes/confirm_order.md) | Complete an order after payment succeeds. For UPI flows, the place-order tool first returns `PENDING_PAYMENT`; call this only after `check_… |
| [`get_payment_options`](https://mcp.swiggy.com/builders/docs/reference/scenes/get_payment_options.md) | Fetch the live payment methods currently available for the cart. Use this when the user is ready to pay or asks which payment options are a… |

### Booking

| Tool | Description |
| --- | --- |
| [`get_event_booking_status`](https://mcp.swiggy.com/builders/docs/reference/scenes/get_event_booking_status.md) | Scenes (Events & Shows): Check the status of an event ticket booking after payment is confirmed. Call this after check_payment_status repor… |
| [`place_event_order`](https://mcp.swiggy.com/builders/docs/reference/scenes/place_event_order.md) | Scenes (Events & Shows): Place an event-ticket order after the user confirms the cart. |

### Support

| Tool | Description |
| --- | --- |
| [`report_error`](https://mcp.swiggy.com/builders/docs/reference/scenes/report_error.md) | Generate an error report to share with the Swiggy MCP team. Use this when the user encounters an error and wants to report it. Returns a pr… |

## Related

- [Authenticate](https://mcp.swiggy.com/builders/docs/start/authenticate.md)
- [Error codes](https://mcp.swiggy.com/builders/docs/reference/errors.md)
- [Quickstart](https://mcp.swiggy.com/builders/docs/start/developer/index.md)
