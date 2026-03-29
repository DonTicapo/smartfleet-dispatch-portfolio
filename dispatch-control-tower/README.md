# Dispatch Control Tower

## One-line purpose
Core dispatch application for order intake, schedule planning, truck assignment, live execution, and exception handling.

## Problem
Give dispatchers one operational cockpit to manage orders, tickets, loads, trucks, drivers, ETAs, exceptions, and plant coordination without relying on fragmented tools.

## Scope
- dispatch board and order queue
- truck/driver assignment logic
- live load lifecycle state machine
- trip detail view linked to route traces
- exception workflows for delay, no-show, plant issue, asset issue
- manual override surfaces for dispatchers

## Non-goals
- direct PLC control
- customer billing engine
- mobile driver app in v1
- deep analytics beyond operational KPIs

## Depends on
- order-ticket-load-core
- navixy-telematics-bridge
- customer-visibility-portal
- analytics-integration-hub

## Recommended stack
- TypeScript / Node.js service core
- Postgres for transactional state where applicable
- Event bus or queue for integration events
- OpenAPI contracts for internal APIs
- Structured logs + metrics from day one
