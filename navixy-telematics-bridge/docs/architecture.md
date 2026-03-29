# Architecture — Navixy Telematics Bridge

## Core responsibility
Leverage existing Smart Fleet/Navixy infrastructure as the telematics backbone for truck visibility, geofence transitions, ETA updates, and route replay.

## Recommended internal modules
- `domain/` — entities, state transitions, invariants
- `application/` — use cases and orchestration
- `infrastructure/` — adapters, persistence, queues, external clients
- `interfaces/` — HTTP/events/CLI handlers
- `tests/` — contract and domain tests

## Key capabilities
- Navixy auth/session management
- asset/device normalization
- position polling or webhook ingestion where available
- trip and route retrieval
- geofence-to-delivery-state inference
- store-and-forward + retry controls

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
