# CLAUDE.md — Customer Visibility Portal

You are working only inside the `customer-visibility-portal` project.

## Mission
Replicate the customer visibility layer so external customers can self-serve delivery status and reduce dispatcher interruptions.

## Product role inside the portfolio
Customer-facing portal for order status, delivery tracking, ETA visibility, ticket lookup, and project-level communication.

## Hard boundaries
- Do not absorb responsibilities that belong to sibling projects.
- Do not turn this repo into a monolith.
- Treat interfaces with sibling projects as contracts, not excuses to duplicate logic.
- Prefer stable domain models and event contracts over quick hacks.
- If a requirement belongs elsewhere, explicitly say so.

## In-scope
- customer login and object-level authorization
- order/ticket status pages
- truck ETA and current delivery state
- project/site-specific views
- message/update feed for delays or exceptions

## Out-of-scope
- dispatcher assignment logic
- plant telemetry ingestion
- financial posting engine

## Dependencies
- order-ticket-load-core
- navixy-telematics-bridge
- analytics-integration-hub

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
