# Order / Ticket / Load Core

## One-line purpose
Canonical domain platform for customers, jobs, sites, orders, tickets, loads, mix designs, and delivery events.

## Problem
Create the single source of truth joining commercial orders, operational execution, telematics events, and plant output.

## Scope
- canonical schema and transactional services
- order-to-ticket-to-load lifecycle
- mix design references and recipe version linkage
- event ledger for delivery-state transitions
- idempotent APIs and domain validation rules

## Non-goals
- UI-heavy dispatch workflows
- plant-device polling
- customer portal frontend

## Depends on
- none (foundation project)

## Recommended stack
- TypeScript / Node.js service core
- Postgres for transactional state where applicable
- Event bus or queue for integration events
- OpenAPI contracts for internal APIs
- Structured logs + metrics from day one
