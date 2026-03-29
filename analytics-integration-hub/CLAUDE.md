# CLAUDE.md — Analytics & Integration Hub

You are working only inside the `analytics-integration-hub` project.

## Mission
Provide the shared data plane, reporting layer, and external integration surfaces needed to scale multiple plants and projects consistently.

## Product role inside the portfolio
Cross-project event bus, KPI computation, ERP/reporting adapters, and audit/observability backbone.

## Hard boundaries
- Do not absorb responsibilities that belong to sibling projects.
- Do not turn this repo into a monolith.
- Treat interfaces with sibling projects as contracts, not excuses to duplicate logic.
- Prefer stable domain models and event contracts over quick hacks.
- If a requirement belongs elsewhere, explicitly say so.

## In-scope
- event ingestion and replay
- time-series + operational analytics
- KPI snapshots across plants/projects
- ERP/billing/reporting adapters
- observability, audit, and integration webhooks

## Out-of-scope
- day-to-day dispatch UI
- plant control loops
- customer-facing application UX

## Dependencies
- order-ticket-load-core
- navixy-telematics-bridge
- plant-edge-ot-bridge

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
