# Interfaces — Plant Edge OT Bridge

## Primary API surfaces
- `POST /edge/batch-events`
- `POST /edge/scale-readings`
- `POST /edge/mixer-status`
- `GET /edge/config`
- `POST /edge/heartbeat`

## External dependencies
- order-ticket-load-core
- analytics-integration-hub

## Contract rules
- All APIs must use stable IDs.
- All timestamps must be UTC internally.
- All externally visible status fields must map to documented enums.
- Do not leak provider-specific payloads directly to consumers.
- Normalize Navixy/plant/provider payloads before exposing them.

## Auth and security
- JWT or service auth for internal APIs
- object-level authorization where data is customer- or plant-scoped
- audit logging for write operations
- deny by default
