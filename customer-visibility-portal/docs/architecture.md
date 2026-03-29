# Architecture — Customer Visibility Portal

## Core responsibility
Replicate the customer visibility layer so external customers can self-serve delivery status and reduce dispatcher interruptions.

## Recommended internal modules
- `domain/` — entities, state transitions, invariants
- `application/` — use cases and orchestration
- `infrastructure/` — adapters, persistence, queues, external clients
- `interfaces/` — HTTP/events/CLI handlers
- `tests/` — contract and domain tests

## Key capabilities
- customer login and object-level authorization
- order/ticket status pages
- truck ETA and current delivery state
- project/site-specific views
- message/update feed for delays or exceptions

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
