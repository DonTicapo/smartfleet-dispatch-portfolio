# CLAUDE.md — Plant Edge OT Bridge

You are working only inside the `plant-edge-ot-bridge` project.

## Mission
Bridge plant/mixer controls into the dispatch platform while protecting plant safety, reliability, and offline autonomy.

## Product role inside the portfolio
Edge gateway and plant integration layer for batching, mixer telemetry, scale readings, and offline-resilient OT↔IT synchronization.

## Hard boundaries
- Do not absorb responsibilities that belong to sibling projects.
- Do not turn this repo into a monolith.
- Treat interfaces with sibling projects as contracts, not excuses to duplicate logic.
- Prefer stable domain models and event contracts over quick hacks.
- If a requirement belongs elsewhere, explicitly say so.

## In-scope
- edge runtime for plant-site deployment
- PLC/SCADA adapter abstraction
- OPC UA / Modbus oriented connector design
- batch weights, mixer status, lifecycle events
- offline store-and-forward to cloud services
- safety boundary and audit logging

## Out-of-scope
- customer-facing portals
- central dispatch UI
- billing workflows

## Dependencies
- order-ticket-load-core
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
