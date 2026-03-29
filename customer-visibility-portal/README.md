# Customer Visibility Portal

## One-line purpose
Customer-facing portal for order status, delivery tracking, ETA visibility, ticket lookup, and project-level communication.

## Problem
Replicate the customer visibility layer so external customers can self-serve delivery status and reduce dispatcher interruptions.

## Scope
- customer login and object-level authorization
- order/ticket status pages
- truck ETA and current delivery state
- project/site-specific views
- message/update feed for delays or exceptions

## Non-goals
- dispatcher assignment logic
- plant telemetry ingestion
- financial posting engine

## Depends on
- order-ticket-load-core
- navixy-telematics-bridge
- analytics-integration-hub

## Recommended stack
- TypeScript / Node.js service core
- Postgres for transactional state where applicable
- Event bus or queue for integration events
- OpenAPI contracts for internal APIs
- Structured logs + metrics from day one
