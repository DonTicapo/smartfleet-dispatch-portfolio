# Architecture — Dispatch Control Tower

## Core responsibility
Give dispatchers one operational cockpit to manage orders, tickets, loads, trucks, drivers, ETAs, exceptions, and plant coordination without relying on fragmented tools.

## Recommended internal modules
- `domain/` — entities, state transitions, invariants
- `application/` — use cases and orchestration
- `infrastructure/` — adapters, persistence, queues, external clients
- `interfaces/` — HTTP/events/CLI handlers
- `tests/` — contract and domain tests

## Key capabilities
- dispatch board and order queue
- truck/driver assignment logic
- live load lifecycle state machine
- trip detail view linked to route traces
- exception workflows for delay, no-show, plant issue, asset issue
- manual override surfaces for dispatchers

## Internal service boundaries
- API layer: request validation and auth
- Application layer: use-case orchestration
- Domain layer: business rules and state machine
- Integration layer: sibling project adapters and third-party integrations
- Persistence layer: transactional storage and/or cache

## Data ownership
This project owns only the data needed for its bounded context.
It should reference sibling-project objects by stable IDs and contracts.

## Events to publish
- domain-specific state changes
- audit-relevant actions
- integration requests/results where appropriate

## Events to consume
- upstream canonical objects or events from sibling projects
- operational telemetry where needed
- authorization or identity context where needed

## Failure strategy
- fail closed on auth
- prefer idempotent commands
- log all integration failures with correlation ids
- support replay where event-driven behavior matters
