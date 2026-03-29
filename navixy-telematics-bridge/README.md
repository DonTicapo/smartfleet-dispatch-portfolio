# Navixy Telematics Bridge

## One-line purpose
Integration layer that turns Navixy assets, positions, geofence events, trips, and routes into canonical dispatch events and telemetry.

## Problem
Leverage existing Smart Fleet/Navixy infrastructure as the telematics backbone for truck visibility, geofence transitions, ETA updates, and route replay.

## Scope
- Navixy auth/session management
- asset/device normalization
- position polling or webhook ingestion where available
- trip and route retrieval
- geofence-to-delivery-state inference
- store-and-forward + retry controls

## Non-goals
- commercial order management
- plant-side PLC integration
- standalone customer portal

## Depends on
- order-ticket-load-core

## Recommended stack
- TypeScript / Node.js service core
- Postgres for transactional state where applicable
- Event bus or queue for integration events
- OpenAPI contracts for internal APIs
- Structured logs + metrics from day one
