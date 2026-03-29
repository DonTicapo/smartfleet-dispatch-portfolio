# Interfaces — Customer Visibility Portal

## Primary API surfaces
- `GET /portal/orders`
- `GET /portal/orders/:orderId`
- `GET /portal/tickets/:ticketId`
- `GET /portal/loads/:loadId/eta`
- `POST /portal/messages`

## External dependencies
- order-ticket-load-core
- navixy-telematics-bridge
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
