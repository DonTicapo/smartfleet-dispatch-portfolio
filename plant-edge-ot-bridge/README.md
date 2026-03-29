# Plant Edge OT Bridge

## One-line purpose
Edge gateway and plant integration layer for batching, mixer telemetry, scale readings, and offline-resilient OT↔IT synchronization.

## Problem
Bridge plant/mixer controls into the dispatch platform while protecting plant safety, reliability, and offline autonomy.

## Scope
- edge runtime for plant-site deployment
- PLC/SCADA adapter abstraction
- OPC UA / Modbus oriented connector design
- batch weights, mixer status, lifecycle events
- offline store-and-forward to cloud services
- safety boundary and audit logging

## Non-goals
- customer-facing portals
- central dispatch UI
- billing workflows

## Depends on
- order-ticket-load-core
- analytics-integration-hub

## Recommended stack
- TypeScript / Node.js service core
- Postgres for transactional state where applicable
- Event bus or queue for integration events
- OpenAPI contracts for internal APIs
- Structured logs + metrics from day one
