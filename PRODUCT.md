# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Older adults, people with disabilities, and people with dietary restrictions who want to find and order food or groceries with minimal friction.

## Product Purpose

Dehleez helps people order food, groceries, dine-in reservations, and event tickets through Sunao, a conversational assistant connected to Swiggy MCP.

## Positioning

An accessible, simple-to-use shopping and ordering experience where people can speak or type naturally and review clear, structured choices before taking an important action.

## Operating Context

People use Dehleez on phones and desktop browsers. The first phase uses a persistent per-device session rather than a Dehleez account; Swiggy authorization is connected separately.

## Capabilities and Constraints

- Gemini powers Sunao and invokes Swiggy through MCP.
- Food, Instamart, Dineout, and Scenes are in scope.
- The Gemini API key and Swiggy tokens remain on the server. Swiggy tokens are stored encrypted in PostgreSQL.
- Production Swiggy use requires delegated-auth onboarding and an allowlisted OAuth callback.
- Source logic adapted from `swiggy-mcp-demo-main` retains its non-commercial license; commercial use requires written permission from the source copyright holder.

## Brand Commitments

- The product name is Dehleez and the assistant is Sunao.
- The user supplied the shadcn preset `bJMY92l6` and a Swiggy-inspired mobile UI reference.
- The interface should be simple, beautiful, responsive, and avoid generic AI styling.

## Evidence on Hand

- User-supplied interface reference image is in the conversation.
- No real restaurant, product, price, or delivery data is supplied; examples must be labeled as illustrative until retrieved from Swiggy.

## Product Principles

- Make the next action obvious.
- Keep ordering steps legible and reviewable.
- Respect dietary constraints and user intent.
- Never place an order or booking without clear confirmation.

## Accessibility & Inclusion

Use large readable text, strong contrast, generous touch targets, semantic controls, keyboard and screen-reader support, adjustable text size, and voice input when the browser supports it.
