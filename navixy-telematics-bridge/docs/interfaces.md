# Interfaces — Navixy Telematics Bridge

## Primary API surfaces
- `POST /bridge/navixy/sync-assets`
- `POST /bridge/navixy/sync-trips`
- `POST /bridge/navixy/routes/by-trip`
- `POST /bridge/navixy/events/geofence`
- `GET /bridge/navixy/health`

## External dependencies
- order-ticket-load-core

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
