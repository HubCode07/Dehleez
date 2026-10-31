# Swiggy MCP documentation audit

Audit date: 2026-10-29. The user-pasted request links 107 unique Swiggy Builders Club pages. All 107 returned HTTP 200 when fetched and their Markdown snapshots are stored under [`swiggy/`](./swiggy/). The filenames below correspond directly to each source URL path; four dated blog pages use `blog_` filenames. The page snapshots are source material, not a claim that production access has been approved.

## Pages checked

The full set is the 107 files in [`swiggy/`](./swiggy/), grouped here for verification:

- Start and onboarding: 14 pages (`docs_start_*` and the general `docs_index.md`): direct developer authentication, consumer setup, enterprise delegated auth, coding-agent documentation, and introductory paths.
- Build: 10 pages (`docs_build_*`): multi-turn cart state, voice/chat response contracts, four ordering recipes including combined Food + Dineout, widgets, retries, production readiness, and build overview.
- Operate: 9 pages (`docs_operate_*`): access, branding, changelog, data handling, rate limits, SLA, support, versioning, and operating overview.
- Tool reference: 73 pages (`docs_reference_*`): shared overview and errors, plus all Food, Instamart, Dineout, and Scenes tool references and indexes.
- Changelog/blog: 4 pages (`blog_2026-*.md`): Builders Club, UPI, address creation, and Swiggy Money updates.

## Implemented from the page requirements

- **MCP and OAuth:** Four separate service endpoints; dynamic tool catalogs per service; PKCE authorization, exact callback/state validation, rotating refresh tokens encrypted at rest, session logout, and sequential initialization for combined requests.
- **Food:** Live restaurant/menu search, customizations passed through the live tool schemas, server-side cart refresh and mutation, coupon tools, current totals, ₹1,000 cart cap guidance, order history/tracking, and cautious non-idempotent placement handling.
- **Instamart:** Address-scoped product and variant search, go-to items, whole-cart replacement behavior, availability and total review, coupons, checkout, and order tracking.
- **Dineout:** Location-scoped restaurant discovery, exact returned slot/date/deal selection, FREE versus PAID branches, booking summaries, payment options, booking status/cancellation confirmation, and the documented `Confirm booking:` confirmation path.
- **Scenes:** Event discovery/search/collections, event detail before venue-scoped show listing, exact `show_time_ist` display and `show_time_unix` retention, ticket and seat availability, authoritative `checkoutMode` handling, free/paid checkout branches, and booking-status verification.
- **Payments:** Live payment options only, enabled methods, Cash/COD and available Swiggy Money, UPI intent/QR selections, bridge links, pending state, and the official Swiggy widget when the tool advertises a widget resource. The agent does not run a competing payment polling loop.
- **Widgets and fallback UI:** Reads advertised widget resources through MCP and places them in script-only sandboxed frames with CSP. Accessible structured cards are used when a tool has no widget. All result cards display the correct square brand logo and exact nearby “Powered by …” attribution.
- **Safety, privacy, and production practices:** Specific confirmation gate for cart/address/coupon/booking/payment mutations; no blind retry of order placement or support-report submission; bounded backoff for retry-safe calls; sanitized per-tool correlation logs; no full MCP tool results in server chat history or browser-persisted card/widget payloads.
- **Voice and mobile:** Voice input is supported when the browser exposes speech recognition; compact structured results are available to the text/chat interface. Mobile navigation menu closes on dismissal, backdrop, and Escape, traps focus, and supports touch-size controls and reduced motion.

## Follow-up limits from the source documentation

- Production access, redirect URI allowlisting, partner SLAs, incident contacts, and scale-specific rate-limit ceilings are Swiggy onboarding/contract actions, not app features. The integration must still be approved and allowlisted before a production rollout.
- The Markdown snapshot omits asset URLs, so the official page's linked square logo artwork was fetched from Swiggy's live brand guide into `public/brand/` and is shown unmodified beside the exact attribution text. The guide's interactive badge downloads are canvas-generated; the in-app badge uses its supplied logo and the guide's text pairing, spacing, and accessibility guidance.
- Browser speech recognition is platform-dependent. The app handles unsupported browsers with a text-entry fallback.
- Swiggy's MCP tool catalog is fetched live, so the 66 tool declarations described by the landing page are not hard-coded. Tool-specific custom cards cover key purchase flows; other tools remain available to the model and render their concise text result.

## UI verification aid

The local snapshots can be read by filename, for example [`docs_reference_food_place_food_order.md`](./swiggy/docs_reference_food_place_food_order.md). To compare the original links and summaries, use the pasted request file referenced in this task. Fetch verification covered every unique URL from that request.

## Exact linked pages

Each source URL below has a corresponding `docs/swiggy/` snapshot.
- [https://mcp.swiggy.com/builders/blog/2026-04-17-builders-club-launch.md](./swiggy/blog_2026-04-17-builders-club-launch.md)
- [https://mcp.swiggy.com/builders/blog/2026-07-10-mcp-payments-upi.md](./swiggy/blog_2026-07-10-mcp-payments-upi.md)
- [https://mcp.swiggy.com/builders/blog/2026-08-24-create-address-ga.md](./swiggy/blog_2026-08-24-create-address-ga.md)
- [https://mcp.swiggy.com/builders/blog/2026-09-30-swiggy-money.md](./swiggy/blog_2026-09-30-swiggy-money.md)
- [https://mcp.swiggy.com/builders/docs/build/agent-patterns/multi-turn-state.md](./swiggy/docs_build_agent-patterns_multi-turn-state.md)
- [https://mcp.swiggy.com/builders/docs/build/agent-patterns/voice-vs-chat.md](./swiggy/docs_build_agent-patterns_voice-vs-chat.md)
- [https://mcp.swiggy.com/builders/docs/build/index.md](./swiggy/docs_build_index.md)
- [https://mcp.swiggy.com/builders/docs/build/recipes/book-a-table.md](./swiggy/docs_build_recipes_book-a-table.md)
- [https://mcp.swiggy.com/builders/docs/build/recipes/combined.md](./swiggy/docs_build_recipes_combined.md)
- [https://mcp.swiggy.com/builders/docs/build/recipes/order-food.md](./swiggy/docs_build_recipes_order-food.md)
- [https://mcp.swiggy.com/builders/docs/build/recipes/order-groceries.md](./swiggy/docs_build_recipes_order-groceries.md)
- [https://mcp.swiggy.com/builders/docs/build/recipes/pay-with-upi.md](./swiggy/docs_build_recipes_pay-with-upi.md)
- [https://mcp.swiggy.com/builders/docs/build/ship-to-production.md](./swiggy/docs_build_ship-to-production.md)
- [https://mcp.swiggy.com/builders/docs/build/widgets.md](./swiggy/docs_build_widgets.md)
- [https://mcp.swiggy.com/builders/docs/index.md](./swiggy/docs_index.md)
- [https://mcp.swiggy.com/builders/docs/operate/access.md](./swiggy/docs_operate_access.md)
- [https://mcp.swiggy.com/builders/docs/operate/brand-guidelines.md](./swiggy/docs_operate_brand-guidelines.md)
- [https://mcp.swiggy.com/builders/docs/operate/changelog.md](./swiggy/docs_operate_changelog.md)
- [https://mcp.swiggy.com/builders/docs/operate/data-and-compliance.md](./swiggy/docs_operate_data-and-compliance.md)
- [https://mcp.swiggy.com/builders/docs/operate/index.md](./swiggy/docs_operate_index.md)
- [https://mcp.swiggy.com/builders/docs/operate/rate-limits.md](./swiggy/docs_operate_rate-limits.md)
- [https://mcp.swiggy.com/builders/docs/operate/sla.md](./swiggy/docs_operate_sla.md)
- [https://mcp.swiggy.com/builders/docs/operate/support.md](./swiggy/docs_operate_support.md)
- [https://mcp.swiggy.com/builders/docs/operate/versioning.md](./swiggy/docs_operate_versioning.md)
- [https://mcp.swiggy.com/builders/docs/reference/dineout/book_table.md](./swiggy/docs_reference_dineout_book_table.md)
- [https://mcp.swiggy.com/builders/docs/reference/dineout/cancel_booking.md](./swiggy/docs_reference_dineout_cancel_booking.md)
- [https://mcp.swiggy.com/builders/docs/reference/dineout/check_payment_status.md](./swiggy/docs_reference_dineout_check_payment_status.md)
- [https://mcp.swiggy.com/builders/docs/reference/dineout/confirm_order.md](./swiggy/docs_reference_dineout_confirm_order.md)
- [https://mcp.swiggy.com/builders/docs/reference/dineout/create_cart.md](./swiggy/docs_reference_dineout_create_cart.md)
- [https://mcp.swiggy.com/builders/docs/reference/dineout/get_available_slots.md](./swiggy/docs_reference_dineout_get_available_slots.md)
- [https://mcp.swiggy.com/builders/docs/reference/dineout/get_booking_status.md](./swiggy/docs_reference_dineout_get_booking_status.md)
- [https://mcp.swiggy.com/builders/docs/reference/dineout/get_payment_options.md](./swiggy/docs_reference_dineout_get_payment_options.md)
- [https://mcp.swiggy.com/builders/docs/reference/dineout/get_restaurant_details.md](./swiggy/docs_reference_dineout_get_restaurant_details.md)
- [https://mcp.swiggy.com/builders/docs/reference/dineout/index.md](./swiggy/docs_reference_dineout_index.md)
- [https://mcp.swiggy.com/builders/docs/reference/dineout/report_error.md](./swiggy/docs_reference_dineout_report_error.md)
- [https://mcp.swiggy.com/builders/docs/reference/dineout/search_restaurants_dineout.md](./swiggy/docs_reference_dineout_search_restaurants_dineout.md)
- [https://mcp.swiggy.com/builders/docs/reference/errors.md](./swiggy/docs_reference_errors.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/apply_food_coupon.md](./swiggy/docs_reference_food_apply_food_coupon.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/check_payment_status.md](./swiggy/docs_reference_food_check_payment_status.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/confirm_order.md](./swiggy/docs_reference_food_confirm_order.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/create_address.md](./swiggy/docs_reference_food_create_address.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/delete_address.md](./swiggy/docs_reference_food_delete_address.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/fetch_food_coupons.md](./swiggy/docs_reference_food_fetch_food_coupons.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/flush_food_cart.md](./swiggy/docs_reference_food_flush_food_cart.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/get_addresses.md](./swiggy/docs_reference_food_get_addresses.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/get_food_cart.md](./swiggy/docs_reference_food_get_food_cart.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/get_food_delivery_status.md](./swiggy/docs_reference_food_get_food_delivery_status.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/get_food_order_details.md](./swiggy/docs_reference_food_get_food_order_details.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/get_food_orders.md](./swiggy/docs_reference_food_get_food_orders.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/get_payment_options.md](./swiggy/docs_reference_food_get_payment_options.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/get_restaurant_menu.md](./swiggy/docs_reference_food_get_restaurant_menu.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/index.md](./swiggy/docs_reference_food_index.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/place_food_order.md](./swiggy/docs_reference_food_place_food_order.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/recommend_address.md](./swiggy/docs_reference_food_recommend_address.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/report_error.md](./swiggy/docs_reference_food_report_error.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/search_menu.md](./swiggy/docs_reference_food_search_menu.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/search_restaurants.md](./swiggy/docs_reference_food_search_restaurants.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/track_food_order.md](./swiggy/docs_reference_food_track_food_order.md)
- [https://mcp.swiggy.com/builders/docs/reference/food/update_food_cart.md](./swiggy/docs_reference_food_update_food_cart.md)
- [https://mcp.swiggy.com/builders/docs/reference/index.md](./swiggy/docs_reference_index.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/apply_coupon.md](./swiggy/docs_reference_instamart_apply_coupon.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/check_payment_status.md](./swiggy/docs_reference_instamart_check_payment_status.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/checkout.md](./swiggy/docs_reference_instamart_checkout.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/clear_cart.md](./swiggy/docs_reference_instamart_clear_cart.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/confirm_order.md](./swiggy/docs_reference_instamart_confirm_order.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/create_address.md](./swiggy/docs_reference_instamart_create_address.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/delete_address.md](./swiggy/docs_reference_instamart_delete_address.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/get_addresses.md](./swiggy/docs_reference_instamart_get_addresses.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/get_cart.md](./swiggy/docs_reference_instamart_get_cart.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/get_delivery_status.md](./swiggy/docs_reference_instamart_get_delivery_status.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/get_order_details.md](./swiggy/docs_reference_instamart_get_order_details.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/get_orders.md](./swiggy/docs_reference_instamart_get_orders.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/get_payment_options.md](./swiggy/docs_reference_instamart_get_payment_options.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/index.md](./swiggy/docs_reference_instamart_index.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/list_coupons.md](./swiggy/docs_reference_instamart_list_coupons.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/recommend_address.md](./swiggy/docs_reference_instamart_recommend_address.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/report_error.md](./swiggy/docs_reference_instamart_report_error.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/search_products.md](./swiggy/docs_reference_instamart_search_products.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/track_order.md](./swiggy/docs_reference_instamart_track_order.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/update_cart.md](./swiggy/docs_reference_instamart_update_cart.md)
- [https://mcp.swiggy.com/builders/docs/reference/instamart/your_go_to_items.md](./swiggy/docs_reference_instamart_your_go_to_items.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/check_payment_status.md](./swiggy/docs_reference_scenes_check_payment_status.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/confirm_order.md](./swiggy/docs_reference_scenes_confirm_order.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/create_event_cart.md](./swiggy/docs_reference_scenes_create_event_cart.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/discover_events.md](./swiggy/docs_reference_scenes_discover_events.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/get_event_booking_status.md](./swiggy/docs_reference_scenes_get_event_booking_status.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/get_event_cart.md](./swiggy/docs_reference_scenes_get_event_cart.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/get_event_details.md](./swiggy/docs_reference_scenes_get_event_details.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/get_event_venue_info.md](./swiggy/docs_reference_scenes_get_event_venue_info.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/get_events_collection.md](./swiggy/docs_reference_scenes_get_events_collection.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/get_payment_options.md](./swiggy/docs_reference_scenes_get_payment_options.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/get_saved_locations.md](./swiggy/docs_reference_scenes_get_saved_locations.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/index.md](./swiggy/docs_reference_scenes_index.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/list_event_shows.md](./swiggy/docs_reference_scenes_list_event_shows.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/place_event_order.md](./swiggy/docs_reference_scenes_place_event_order.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/report_error.md](./swiggy/docs_reference_scenes_report_error.md)
- [https://mcp.swiggy.com/builders/docs/reference/scenes/search_events.md](./swiggy/docs_reference_scenes_search_events.md)
- [https://mcp.swiggy.com/builders/docs/start/authenticate.md](./swiggy/docs_start_authenticate.md)
- [https://mcp.swiggy.com/builders/docs/start/coding-agents.md](./swiggy/docs_start_coding-agents.md)
- [https://mcp.swiggy.com/builders/docs/start/consumer/index.md](./swiggy/docs_start_consumer_index.md)
- [https://mcp.swiggy.com/builders/docs/start/consumer/use-in-ai-client.md](./swiggy/docs_start_consumer_use-in-ai-client.md)
- [https://mcp.swiggy.com/builders/docs/start/developer/build-an-agent.md](./swiggy/docs_start_developer_build-an-agent.md)
- [https://mcp.swiggy.com/builders/docs/start/developer/index.md](./swiggy/docs_start_developer_index.md)
- [https://mcp.swiggy.com/builders/docs/start/enterprise/delegated-auth.md](./swiggy/docs_start_enterprise_delegated-auth.md)
- [https://mcp.swiggy.com/builders/docs/start/enterprise/index.md](./swiggy/docs_start_enterprise_index.md)
- [https://mcp.swiggy.com/builders/docs/start/index.md](./swiggy/docs_start_index.md)
- [https://mcp.swiggy.com/builders/docs/start/what-is-swiggy-mcp.md](./swiggy/docs_start_what-is-swiggy-mcp.md)
