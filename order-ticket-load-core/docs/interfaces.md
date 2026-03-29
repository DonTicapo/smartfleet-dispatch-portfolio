# Interfaces — Order / Ticket / Load Core

## Primary API surfaces
- `POST /customers`
- `POST /jobs`
- `POST /orders`
- `POST /tickets`
- `POST /loads`
- `POST /events/delivery-state`
- `GET /tickets/:ticketId`

## External dependencies
- none

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
