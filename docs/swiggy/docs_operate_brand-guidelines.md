# Brand guidelines

> Logos, attribution, and usage requirements for Swiggy, Instamart, and Dineout integrations.

[Download assets](#brand-assets) · [Logo attribution](#logo-attribution)

## Choose the right brand [#our-brands]

Select a service to see its logo, attribution, and placement requirements.

| Brand | Service | Description |
| --- | --- | --- |
| Swiggy | Food | Restaurant discovery, food ordering, and delivery. |
| Instamart | Groceries | Groceries and everyday essentials, inside your product. |
| Dineout | Dining out | Restaurant discovery, table reservations, and dining. |

**Required attribution.** Every integration must pair the relevant square logo with **“Powered by Swiggy”**, **“Powered by Instamart”**, or **“Powered by Dineout”**, matching the service. This applies to both developer and enterprise products.

## Logo attribution [#logo-attribution]

Place the square logo before the complete attribution. Keep both together, readable, and close to the experience they power.

Square logo + exact attribution. Use the complete logo and attribution together.

**Acceptable background treatments**

- Light surface
- Dark surface
- Solid backing on a busy surface

The same full-colour artwork is used in every treatment. Download the square logos and complete badges below.

## Download logos and badges [#brand-assets]

Download a square logo or a complete attribution badge for each service. Choose a light or dark badge to suit your layout, and preserve the original artwork.

The interactive page provides **Square logo**, **Badge · light**, and **Badge · dark** downloads as **PNG** or **SVG** for Swiggy, Instamart, and Dineout. Square logos are **512 × 512 · rounded corners**. Badges use **Full attribution · 3× PNG**.

PNG logos have transparent rounded corners. Badges include their light or dark backing and clear space. SVG files embed the original raster logo; the badge text remains editable.

## Size and clear space [#size-spacing]

Follow these minimum sizes and spacing requirements.

| Element | Standard | Compact |
| --- | --- | --- |
| Square logo | 32 × 32 | 24 × 24 minimum |
| Attribution text | 16 | 14 minimum |
| Logo-to-text gap | 8 minimum | 8 minimum |
| Clear space on all sides | 8 minimum | 8 minimum |

Use CSS pixels on web, points on iOS, and dp for Android layout / sp for text. Allow more room for larger text settings. Larger badges should scale their spacing proportionally.

- Keep the square logo at its original 1:1 ratio, including its internal padding and rounded corners. The corner radius is 20% of the logo width.
- Keep text, controls, and decorative elements outside the badge’s clear space.
- On small screens, give the badge its own row. Keep the full phrase visible.

## Accessibility [#accessibility]

Keep attribution readable and give it a meaningful accessible label.

**Keep it readable**

Maintain at least 4.5:1 contrast for the attribution text. Use the artwork at full opacity, on a clear surface. Change the backing surface to improve visibility; preserve the logo colours.

**Give it a meaningful label**

A badge image needs the label **“Powered by Swiggy”**, **“Powered by Instamart”**, or **“Powered by Dineout”**, matching the service. When the logo sits beside live attribution text, make the logo decorative so the phrase is read once.

**Make room for larger text**

Support text scaling and zoom without cropping the logo or truncating the brand name. Let the surrounding layout grow to fit.

**Keep actions separate**

The badge identifies the service. Order, booking, and sign-in actions belong in their own labelled controls, with visible keyboard focus.

## Text and messaging [#text-attribution]

Keep the badge wording exact. Use the accompanying messages to introduce the service in your own product.

| Service | Required attribution | Feature headline | Feature description |
| --- | --- | --- | --- |
| Food | Powered by Swiggy | Order food with Swiggy | Browse restaurants and order food through Swiggy, right here in [Product]. |
| Groceries | Powered by Instamart | Shop groceries with Instamart | Find everyday essentials and place your order through Instamart, right here in [Product]. |
| Dining out | Powered by Dineout | Find your next table with Dineout | Discover restaurants and reserve a table through Dineout, right here in [Product]. |

- Keep the spelling and capitalisation: **Swiggy**, **Instamart**, and **Dineout**. Do not abbreviate the names or translate them yourself.
- Use “Powered by” in full. An action such as “Book with Dineout” does not replace the attribution badge.
- Use supplied translations when available. A text-only channel that cannot display images must still include the complete attribution with its results and confirmation.
- Describe capabilities you actually offer. Quote delivery estimates, dining offers, and availability only when supported by the service response.

In voice-only experiences, name the service when introducing the feature and confirming a transaction. Visual interfaces must retain the square logo.

## Where to show attribution [#placement]

Swiggy, Instamart, or Dineout attribution belongs with the service, from the first result to the final confirmation.

| Brand | Step | Placement |
| --- | --- | --- |
| Swiggy | Discover | Beside the restaurant or menu heading. |
| Swiggy | Choose | Within the food item or restaurant detail. |
| Swiggy | Order | Alongside the cart, before placing the order. |
| Swiggy | Track | With the order confirmation and delivery status. |
| Instamart | Discover | Above the grocery search or category results. |
| Instamart | Choose | Within the product detail and availability view. |
| Instamart | Order | Alongside the cart and checkout summary. |
| Instamart | Track | With the order confirmation and delivery status. |
| Dineout | Discover | Above dining recommendations and restaurant results. |
| Dineout | Choose | Beside restaurant details and available table slots. |
| Dineout | Reserve | Alongside the booking summary, before confirmation. |
| Dineout | Visit | With booking status and dining payment details, where supported. |

**One product, more than one service?**

Keep each badge with its own results, cart, order, or booking. Changing the service must change the badge. A single badge can cover a clearly bounded group; a standalone card needs its own attribution.

- Food: Powered by Swiggy
- Groceries: Powered by Instamart
- Dining out: Powered by Dineout

Keep attribution visible in long result lists and agent responses. A global footer, a tooltip, or a one-time onboarding message is not enough. Unrelated account screens do not need a badge.

## Correct and incorrect usage [#correct-usage]

Preserve the artwork, proportions, contrast, and clear space.

| Label | Guidance |
| --- | --- |
| ✓ Do | Use the complete badge, with the original artwork and clear space. |
| × Don’t | Recolour, fade, or add effects to the logo. |
| × Don’t | Stretch the artwork or change its proportions. |
| × Don’t | Let the background compete with the attribution. |
| × Don’t | Place content or controls inside the badge’s clear space. |
| × Don’t | Merge the services into a generic attribution. |

Keep your product’s identity distinct. Avoid “official app”, “certified”, or endorsement claims unless separately agreed. Never use a brand badge to attribute another provider’s content.

## Launch checklist [#launch-checklist]

Review each requirement before launching your integration.

- [ ] Each service uses its own square logo and exact “Powered by” wording.
- [ ] Attribution is visible from discovery through order or booking confirmation.
- [ ] Mixed service screens identify each service and transaction separately.
- [ ] Artwork, spacing, contrast, and accessible labels follow the guidelines.
- [ ] The badge stays readable on mobile, dark backgrounds, and enlarged text.
- [ ] Messaging describes available capabilities and makes no unsupported claims.

For your review · not saved

Swiggy Builders Club · Brand guidelines · 9 October 2026
