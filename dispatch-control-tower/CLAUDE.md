# CLAUDE.md — Dispatch Control Tower

You are working only inside the `dispatch-control-tower` project.

## Mission
Give dispatchers one operational cockpit to manage orders, tickets, loads, trucks, drivers, ETAs, exceptions, and plant coordination without relying on fragmented tools.

## Product role inside the portfolio
Core dispatch application for order intake, schedule planning, truck assignment, live execution, and exception handling.

## Hard boundaries
- Do not absorb responsibilities that belong to sibling projects.
- Do not turn this repo into a monolith.
- Treat interfaces with sibling projects as contracts, not excuses to duplicate logic.
- Prefer stable domain models and event contracts over quick hacks.
- If a requirement belongs elsewhere, explicitly say so.

## In-scope
- dispatch board and order queue
- truck/driver assignment logic
- live load lifecycle state machine
- trip detail view linked to route traces
- exception workflows for delay, no-show, plant issue, asset issue
- manual override surfaces for dispatchers

## Out-of-scope
- direct PLC control
- customer billing engine
- mobile driver app in v1
- deep analytics beyond operational KPIs

## Dependencies
- order-ticket-load-core
- navixy-telematics-bridge
- customer-visibility-portal
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
