# Versioning

> SemVer commitment, deprecation window, how we announce breaking changes.

## SemVer commitment

Swiggy MCP follows **semantic versioning** at the server level:

- **MAJOR** (`2.0.0`) - backwards-incompatible change. Minimum **6-month deprecation window**.
- **MINOR** (`1.1.0`) - backwards-compatible new capability. Safe to adopt immediately.
- **PATCH** (`1.0.1`) - bug fixes, no schema change.

The current server version is announced in the MCP `initialize` response under `serverInfo.version` (the server currently reports `0.1.0`).

## What counts as breaking

These require a major bump + deprecation notice:

- Removing a tool.
- Renaming a tool.
- Removing a required parameter.
- Adding a new required parameter.
- Changing a response field's type.
- Removing a response field.

These are **non-breaking** and ship without a major bump:

- Adding a new tool.
- Adding a new optional parameter.
- Adding a new response field.
- Adding a new OAuth scope.
- Widening a parameter's accepted range (e.g. string enum gaining a value).
- Adding a new `error.code` - your client should handle unknown codes as generic failures.

## Deprecation window

From announcement to removal: **minimum 6 months**.

```
Day 0    Announcement. New behaviour ships alongside old.
Day 90   Deprecation notice published to the changelog and emailed to integrators.
Day 150  Escalated reminder emailed to integrators.
Day 180  Old behaviour removed.
```

Deprecation notices flow through email and the [changelog](https://mcp.swiggy.com/builders/docs/operate/changelog.md).

## How we announce

1. **Email** to your designated engineering contact (at least 7 days before the public announcement).
2. **Blog post** at [/blog](https://mcp.swiggy.com/builders/blog/) tagged `breaking` and `deprecation`.
3. **Changelog entry** with a ⚠ flag ([changelog](https://mcp.swiggy.com/builders/docs/operate/changelog.md)).

## What you must do

- Subscribe your engineering alias to announcements - mail [builders@swiggy.in](mailto:builders@swiggy.in) with the address to add.
- Watch email and the [changelog](https://mcp.swiggy.com/builders/docs/operate/changelog.md) for deprecation notices.
- Plan migrations to complete well before the 180-day cutoff.

## Experimental features

From time to time we'll ship **experimental** tools or parameters. These are documented in [reference](https://mcp.swiggy.com/builders/docs/reference/index.md) with an `experimental` tag. They can change or disappear without the 6-month deprecation window. Use them when you want the capability early; plan for churn.
