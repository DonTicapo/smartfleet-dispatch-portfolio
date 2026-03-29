# Interfaces — Analytics & Integration Hub

## Primary API surfaces
- `POST /events`
- `GET /kpis/plants`
- `GET /kpis/dispatch`
- `POST /integrations/erp/export`
- `POST /integrations/webhooks`

## External dependencies
- order-ticket-load-core
- navixy-telematics-bridge
- plant-edge-ot-bridge

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
