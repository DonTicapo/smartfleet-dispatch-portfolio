# CLAUDE.md — Navixy Telematics Bridge

You are working only inside the `navixy-telematics-bridge` project.

## Mission
Leverage existing Smart Fleet/Navixy infrastructure as the telematics backbone for truck visibility, geofence transitions, ETA updates, and route replay.

## Product role inside the portfolio
Integration layer that turns Navixy assets, positions, geofence events, trips, and routes into canonical dispatch events and telemetry.

## Hard boundaries
- Do not absorb responsibilities that belong to sibling projects.
- Do not turn this repo into a monolith.
- Treat interfaces with sibling projects as contracts, not excuses to duplicate logic.
- Prefer stable domain models and event contracts over quick hacks.
- If a requirement belongs elsewhere, explicitly say so.

## In-scope
- Navixy auth/session management
- asset/device normalization
- position polling or webhook ingestion where available
- trip and route retrieval
- geofence-to-delivery-state inference
- store-and-forward + retry controls

## Out-of-scope
- commercial order management
- plant-side PLC integration
- standalone customer portal

## Dependencies
- order-ticket-load-core

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
