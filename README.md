# SmartFleet Dispatch Portfolio

[![CI](https://github.com/DonTicapo/smartfleet-dispatch-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/DonTicapo/smartfleet-dispatch-portfolio/actions/workflows/ci.yml)
[![Landing Page](https://github.com/DonTicapo/smartfleet-dispatch-portfolio/actions/workflows/pages.yml/badge.svg)](https://donticapo.github.io/smartfleet-dispatch-portfolio/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white)](https://fastify.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)

Full-stack ready-mix concrete dispatch platform — 6 bounded-context microservices demonstrating domain-driven design, event-driven architecture, and operational technology integration.

> **[View Live Landing Page](https://donticapo.github.io/smartfleet-dispatch-portfolio/)** | **[Browse API Collection](./api-collection/)**

## Architecture

```mermaid
graph TB
    subgraph External
        NAV[Navixy GPS API]
        PLC[PLC / SCADA]
        ERP[ERP Systems]
        CUS[Customer Browser]
    end

    subgraph SmartFleet Platform
        OTL[Order Ticket Load Core<br/>:3000<br/><i>Canonical Domain</i>]
        NTB[Navixy Telematics Bridge<br/>:3001<br/><i>GPS + Geofence</i>]
        DCT[Dispatch Control Tower<br/>:3002<br/><i>Assignment + Exceptions</i>]
        CVP[Customer Visibility Portal<br/>:3003<br/><i>Status + ETA</i>]
        AIH[Analytics Integration Hub<br/>:3004<br/><i>KPIs + Events</i>]
        PEOB[Plant Edge OT Bridge<br/>:3005<br/><i>Batch + Mixer</i>]
    end

    subgraph Data
        PG[(PostgreSQL 16<br/>6 databases)]
    end

    NAV -->|tracker sync| NTB
    PLC -->|telemetry| PEOB
    CUS -->|portal| CVP
    ERP <-->|export| AIH

    NTB -->|geofence events| OTL
    DCT -->|assignments| OTL
    DCT -->|positions| NTB
    CVP -->|order/ticket data| OTL
    CVP -->|load positions| NTB
    AIH -->|canonical events| OTL
    AIH -->|telemetry events| NTB
    AIH -->|batch events| PEOB
    PEOB -->|batch→ticket link| OTL

    OTL --- PG
    NTB --- PG
    DCT --- PG
    CVP --- PG
    AIH --- PG
    PEOB --- PG

    style OTL fill:#4a90d9,color:#fff
    style NTB fill:#50b86c,color:#fff
    style DCT fill:#e6a23c,color:#fff
    style CVP fill:#9b59b6,color:#fff
    style AIH fill:#e74c3c,color:#fff
    style PEOB fill:#1abc9c,color:#fff
```

| Service | Port | Description |
|---------|------|-------------|
| [order-ticket-load-core](./order-ticket-load-core) | 3000 | Canonical domain: customers, jobs, orders, tickets, loads, delivery events |
| [navixy-telematics-bridge](./navixy-telematics-bridge) | 3001 | Telematics integration: GPS tracking, geofence inference, store-and-forward |
| [dispatch-control-tower](./dispatch-control-tower) | 3002 | Dispatch operations: truck/driver assignment, exception handling, board |
| [customer-visibility-portal](./customer-visibility-portal) | 3003 | Customer portal: order status, ETA tracking, delivery messaging |
| [analytics-integration-hub](./analytics-integration-hub) | 3004 | Analytics: event ingestion, KPI computation, ERP export, webhooks |
| [plant-edge-ot-bridge](./plant-edge-ot-bridge) | 3005 | Plant edge: batch events, scale readings, mixer state machine, offline sync |

## Tech Stack

- **Runtime:** Node.js 22+ / TypeScript (ES modules)
- **Framework:** Fastify 5
- **Database:** PostgreSQL 16
- **Validation:** Zod
- **Auth:** JWT (Bearer)
- **Testing:** Vitest
- **ORM/Query:** Knex
- **Docs:** OpenAPI / Swagger UI

## Quick Start

### Prerequisites
- Node.js >= 22
- PostgreSQL 16+ (or Docker)

### Option A: Docker (recommended)
```bash
docker compose up -d
```
This starts all 6 services + a shared PostgreSQL instance. Then run migrations:
```bash
for dir in order-ticket-load-core navixy-telematics-bridge dispatch-control-tower customer-visibility-portal analytics-integration-hub plant-edge-ot-bridge; do
  (cd $dir && npm run migrate)
done
```

### Option B: Local development
```bash
# Install dependencies for all projects
for dir in order-ticket-load-core navixy-telematics-bridge dispatch-control-tower customer-visibility-portal analytics-integration-hub plant-edge-ot-bridge; do
  (cd $dir && npm install)
done

# Start PostgreSQL and create databases (see scripts/init-databases.sql)

# Run migrations
for dir in order-ticket-load-core navixy-telematics-bridge dispatch-control-tower customer-visibility-portal analytics-integration-hub plant-edge-ot-bridge; do
  (cd $dir && npm run migrate)
done

# Start services (each in its own terminal)
cd order-ticket-load-core && npm run dev
cd navixy-telematics-bridge && npm run dev
cd dispatch-control-tower && npm run dev
cd customer-visibility-portal && npm run dev
cd analytics-integration-hub && npm run dev
cd plant-edge-ot-bridge && npm run dev
```

### Option C: Seed demo data
```bash
for dir in order-ticket-load-core navixy-telematics-bridge dispatch-control-tower customer-visibility-portal analytics-integration-hub plant-edge-ot-bridge; do
  (cd $dir && npm run seed)
done
```

## Testing
```bash
# Run all tests
for dir in order-ticket-load-core navixy-telematics-bridge dispatch-control-tower customer-visibility-portal analytics-integration-hub plant-edge-ot-bridge; do
  echo "--- $dir ---"
  (cd $dir && npm test)
done
```

## API Documentation
Each service exposes Swagger UI at `/docs`:
- http://localhost:3000/docs — Order/Ticket/Load Core
- http://localhost:3001/docs — Navixy Telematics Bridge
- http://localhost:3002/docs — Dispatch Control Tower
- http://localhost:3003/docs — Customer Visibility Portal
- http://localhost:3004/docs — Analytics Integration Hub
- http://localhost:3005/docs — Plant Edge OT Bridge

## Project Structure
Each service follows identical DDD layered architecture:
```
service-name/
├── src/
│   ├── domain/          # Entities, enums, value objects, errors, state machines
│   ├── application/     # Services (use-case orchestration)
│   ├── infrastructure/  # Repositories, middleware, DB, external clients
│   └── interfaces/      # HTTP routes, schemas, Swagger
├── tests/               # Unit + integration tests
├── package.json
├── tsconfig.json
└── knexfile.ts
```
