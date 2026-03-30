# API Gateway

Nginx reverse proxy providing a single entry point for all 6 SmartFleet services.

## Quick Start

```bash
cd gateway
docker compose up -d
```

All services accessible on **http://localhost:8080**.

## Route Map

| Gateway Path | Service | Upstream |
|---|---|---|
| `/api/otl/*` | Order Ticket Load Core | :3000 |
| `/api/ntb/*` | Navixy Telematics Bridge | :3001 |
| `/api/dct/*` | Dispatch Control Tower | :3002 |
| `/api/cvp/*` | Customer Visibility Portal | :3003 |
| `/api/aih/*` | Analytics Integration Hub | :3004 |
| `/api/peob/*` | Plant Edge OT Bridge | :3005 |
| `/ws/*` | WebSocket (CVP load tracking) | :3003 |
| `/docs/{svc}/` | Swagger UI per service | respective |
| `/health` | Gateway health | local |

## Examples

```bash
# List customers via gateway
curl http://localhost:8080/api/otl/customers -H "Authorization: Bearer $TOKEN"

# Get dispatch board
curl http://localhost:8080/api/dct/dispatch/board?date=2026-03-29 -H "Authorization: Bearer $TOKEN"

# Ingest analytics event
curl -X POST http://localhost:8080/api/aih/events -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"eventId":"..."}'

# WebSocket load tracking
wscat -c ws://localhost:8080/ws/loads/LOAD_ID?token=JWT_TOKEN
```

## Features

- Path-based routing to all 6 services
- WebSocket upgrade support for real-time tracking
- `X-Request-ID` and `X-Correlation-ID` header propagation
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- Rate limiting (100 req/s per IP, burst 50)
- Swagger UI passthrough per service
