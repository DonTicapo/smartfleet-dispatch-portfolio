# Analytics & Integration Hub

## One-line purpose
Cross-project event bus, KPI computation, ERP/reporting adapters, and audit/observability backbone.

## Problem
Provide the shared data plane, reporting layer, and external integration surfaces needed to scale multiple plants and projects consistently.

## Scope
- event ingestion and replay
- time-series + operational analytics
- KPI snapshots across plants/projects
- ERP/billing/reporting adapters
- observability, audit, and integration webhooks

## Non-goals
- day-to-day dispatch UI
- plant control loops
- customer-facing application UX

## Depends on
- order-ticket-load-core
- navixy-telematics-bridge
- plant-edge-ot-bridge

## Recommended stack
- TypeScript / Node.js service core
- Postgres for transactional state where applicable
- Event bus or queue for integration events
- OpenAPI contracts for internal APIs
- Structured logs + metrics from day one
