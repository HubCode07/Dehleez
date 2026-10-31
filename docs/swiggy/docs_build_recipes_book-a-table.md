# Book a table

> Dineout journey - find a restaurant, check availability, reserve.

Dineout is Swiggy's table-reservation surface across 50+ Indian cities. The flow is compact: find → check slots → book → confirm.

## The flow

```
search_restaurants_dineout ──► get_restaurant_details
                                        │
                                        ▼
                               get_available_slots ──► book_table ──► get_booking_status
```

## Step 1 - Search

Dineout search takes the coordinates of the city or area the user named. There is no saved-address lookup. If the user says "near me" without a place, ask which city or area.

```ts
const restaurants = await client.callTool({
  name: "search_restaurants_dineout",
  arguments: {
    latitude: 12.9716,
    longitude: 77.5946,
    query: "italian",
  },
});
```

Results include availability status, offers, cuisines, and price range. Filter to restaurants where availability is `"AVAILABLE"` before presenting.

## Step 2 - Dig into details

```ts
const details = await client.callTool({
  name: "get_restaurant_details",
  arguments: { restaurantId: restaurants.data.restaurants[0].id },
});
// details.data: ratings, amenities, menu images, exclusive Dineout deals
```

## Step 3 - Check available slots

```ts
const slots = await client.callTool({
  name: "get_available_slots",
  arguments: {
    restaurantId: details.data.id,
    date: "2026-05-01",
    guestCount: 4,
  },
});
// slots.data has 7-day forward availability, broken into breakfast/lunch/dinner bands
```

Surface slot times in the user's timezone (all restaurants are in India; IST applies).

## Step 4 - Book

```ts
const booking = await client.callTool({
  name: "book_table",
  arguments: {
    restaurantId: details.data.id,
    slotId: slots.data.slots[0].slotId,
    guestCount: 4,
  },
});
```

**Important**: `book_table` is **not idempotent**. On 5xx, call [`get_booking_status`](https://mcp.swiggy.com/builders/docs/reference/dineout/get_booking_status.md) with the restaurant and slot before retrying.

## Step 5 - Confirm

```ts
const status = await client.callTool({
  name: "get_booking_status",
  arguments: { bookingId: booking.data.bookingId },
});
```

Send the user the confirmation number and the restaurant's address.

## Agent prompt

> **Note**
>
> You help users book restaurant tables on Swiggy Dineout. Ask for the city or area if the user has not named one, then search with its `latitude` and `longitude`. Always confirm slot date, time, and party size with the user before `book_table`. Show restaurant details (amenities, deals) before asking for slot confirmation.

## Common errors

- `SLOT_UNAVAILABLE` → slot filled; refetch availability and offer alternatives.
- `RESTAURANT_NOT_BOOKABLE` → restaurant isn't Dineout-enabled; offer dine-in walk-in guidance or a Food order instead.
- `BOOKING_WINDOW_CLOSED` → outside booking hours; present next available day.

Full catalogue: [errors](https://mcp.swiggy.com/builders/docs/reference/errors.md).
