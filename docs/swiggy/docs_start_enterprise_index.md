# Power an agent platform

> White-glove onboarding for agent-platform operators running Swiggy on behalf of many end users.

For agent-platform operators - voice assistants, in-app agents, conversational commerce surfaces - where your users are Swiggy users, but via your product. Not for individual developers (that's [Developer](https://mcp.swiggy.com/builders/docs/start/developer/index.md)).

## Who this track is for

- **Voice assistants**: smart speakers, automotive voice agents, and TV voice surfaces.
- **Messaging-driven commerce**: WhatsApp-style replenishment agents, in-chat ordering.
- **Lifestyle apps with agents**: fitness, meal-planning, concierge products where Swiggy is one of many commerce backends.
- **Enterprise SaaS**: procurement, corporate meal ordering.

If that sounds like you, the table below is your track.

| What you get | What you owe |
| --- | --- |
| Delegated OAuth for multi-tenant user flows | Valid end-user consent per DPDP |
| Capacity planning with your partnership team for your expected traffic | Responsible traffic shaping; share expected QPS and daily volume at onboarding |
| Dedicated engineering contact + escalation path | Security review; see [Access](https://mcp.swiggy.com/builders/docs/operate/access.md) |
| Co-branding options ("Powered by Swiggy") | Follow brand guidelines (shared at onboarding) |
| Partner attribution + engagement signals back to you | Keep attribution fidelity (no stripping) |
| Pre-production staging environment with seed data | Observe staging-only guardrails |

## How onboarding works

1. **Apply** at [/access](https://mcp.swiggy.com/builders/access/) marking yourself as a platform operator. Include expected user base (size, geographies), surfaces (voice/chat/app), and peak QPS.
2. **Intro call** - 30 minutes with Swiggy's partnerships team to scope fit.
3. **Architecture review** - 30-60 minutes with engineering. Covers delegated auth, rate-limit targets, observability handoff, brand integration.
4. **Partner contract** - commercial terms, compliance attestations, co-branding rights. Turnaround: 4+ weeks for enterprise-specific clauses.
5. **Staging access** - your OAuth redirect details are allowlisted, then your engineering team walks through [Delegated auth](https://mcp.swiggy.com/builders/docs/start/enterprise/delegated-auth.md).
6. **Production cutover** - after a partner-specific launch checklist (rate-limit uplift, incident-response handoff, co-branding assets).

## The hard parts you'll care about

- [**Delegated auth at scale**](https://mcp.swiggy.com/builders/docs/start/enterprise/delegated-auth.md) - OAuth 2.1 on-behalf-of flow for brokering Swiggy tool calls for thousands or millions of end users, with per-user consent and Swiggy holding the PII.
- [**Rate limits**](https://mcp.swiggy.com/builders/docs/operate/rate-limits.md) - gateway-enforced per-user and aggregate caps return `429` + `Retry-After` (no `X-RateLimit-*` headers); align on expected QPS and daily volume with your partnership team.
- [**SLA**](https://mcp.swiggy.com/builders/docs/operate/sla.md) - 99.9% uptime target on production MCP endpoints; latency targets per tool class.
- [**Data handling**](https://mcp.swiggy.com/builders/docs/operate/data-and-compliance.md) - Swiggy is the data fiduciary under DPDP 2023. Your product processes Swiggy data only within the contracted scope.
- [**Voice-first response shaping**](https://mcp.swiggy.com/builders/docs/build/agent-patterns/voice-vs-chat.md) - for TTS and in-car surfaces, rich card widgets don't help. Design tool prompts for concise, imperative responses.

## Get in touch

- Primary: [builders@swiggy.in](mailto:builders@swiggy.in) with subject line "Platform partner - [your company]"
- Urgent (existing partner incident): your designated engineering contact + [security@swiggy.in](mailto:security@swiggy.in) if security-related
