# Support

> How to reach us, incident severities, co-branding, and agent error reporting.

## Contact channels

| Channel | Use for |
| --- | --- |
| [builders@swiggy.in](mailto:builders@swiggy.in) | General developer questions, onboarding, rate-limit increases, docs feedback |
| [security@swiggy.in](mailto:security@swiggy.in) | Security vulnerabilities (responsible disclosure, 90-day window) |
| Your designated engineering contact | Production incidents (enterprise only) |
| [`report_error`](https://mcp.swiggy.com/builders/docs/reference/food/report_error.md) tool | Agent-invoked error reporting during a live session |

## Response SLA

| Severity | Trigger | Ack | Update cadence |
| --- | --- | --- | --- |
| **S0** | Production down for your integration's users | < 30 min | Every 30 min |
| **S1** | Major feature broken, partial outage | < 2 hr (business hours) | Every 2 hr |
| **S2** | Degraded quality, non-critical | < 1 business day | Daily |
| **S3** | Question, feature request | < 3 business days | As needed |

Enterprise partners have shorter SLAs written into the contract.

## When to use the `report_error` tool

Swiggy exposes `report_error` on all four servers as a runtime support channel. Use it when an **agent** hits an error mid-flow and the user should be able to report without leaving the conversation. The tool captures tool name, error context, flow description, and optional user notes; our support team sees it with the session id pre-linked.

This is for **in-session, user-reported** errors. Silent 4xx/5xx for a developer debugging their integration goes through email.

## Incident procedure (from your side)

1. Capture **session ids** for the failing calls.
2. Note the **time range** (UTC or IST - either is fine).
3. Describe the **expected vs actual behaviour**.
4. Mail `builders@swiggy.in` (or your designated contact for enterprise) with subject `[SEV-n] <short summary>`.

For S0s with enterprise engagement, include your on-call number; we'll reach out by phone.

## Co-branding

Use the [Brand guidelines & downloads](https://mcp.swiggy.com/builders/docs/operate/brand-guidelines.md) for logos, attribution badges, placement, size, and accessibility requirements. Pair each service's square logo with its complete attribution:

- Food: **Powered by Swiggy**.
- Groceries: **Powered by Instamart**.
- Dining out: **Powered by Dineout**.

Keep the supplied artwork intact and attribute each service next to its content. Do not imply endorsement or partnership beyond your agreement. Custom co-branding arrangements are agreed per partner.

## Status & incidents

Incident information flows to your designated engineering contact via email and/or Slack for enterprise. Subscribe your engineering alias to announcements - mail `builders@swiggy.in`.

## Feedback

Documentation feedback, tool-design suggestions, new capability requests - all welcome at `builders@swiggy.in`. We track suggestions and batch them into the roadmap.
