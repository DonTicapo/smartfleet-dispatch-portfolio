# CLAUDE.md — Order / Ticket / Load Core

You are working only inside the `order-ticket-load-core` project.

## Mission
Create the single source of truth joining commercial orders, operational execution, telematics events, and plant output.

## Product role inside the portfolio
Canonical domain platform for customers, jobs, sites, orders, tickets, loads, mix designs, and delivery events.

## Hard boundaries
- Do not absorb responsibilities that belong to sibling projects.
- Do not turn this repo into a monolith.
- Treat interfaces with sibling projects as contracts, not excuses to duplicate logic.
- Prefer stable domain models and event contracts over quick hacks.
- If a requirement belongs elsewhere, explicitly say so.

## In-scope
- canonical schema and transactional services
- order-to-ticket-to-load lifecycle
- mix design references and recipe version linkage
- event ledger for delivery-state transitions
- idempotent APIs and domain validation rules

## Out-of-scope
- UI-heavy dispatch workflows
- plant-device polling
- customer portal frontend

## Dependencies
- none

## First principles
- Build the smallest viable bounded context.
- Make contracts explicit.
- Separate operational UI from canonical data.
- Assume integrations are unreliable until proven otherwise.
- Design for auditability and replay where events matter.
- Keep security and authorization first-class.

## What to create first
1. domain model
2. interface contracts
3. service boundaries
4. minimal bootstrap implementation plan

## What to avoid early
- fancy dashboards before stable data contracts
- speculative microservices
- premature multi-tenant overengineering inside a single project
- hidden coupling to other repos

## Output style
- concrete
- architecture-first
- implementation-ready
- no fluff
