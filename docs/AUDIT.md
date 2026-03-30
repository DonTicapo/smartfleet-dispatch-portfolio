# SmartFleet Dispatch Portfolio — Audit Guide

Complete reference for reviewing and verifying the portfolio.

---

## Quick Verification Commands

```bash
# Clone and enter
git clone https://github.com/DonTicapo/smartfleet-dispatch-portfolio.git
cd smartfleet-dispatch-portfolio

# Install all dependencies
npm run install:all

# Typecheck all 6 backends (should show 0 errors)
npm run typecheck:all

# Lint all 6 backends (should show 0 errors)
npm run lint:all

# Build all 6 backends (should show 0 errors)
npm run build:all

# Run all unit tests (304 should pass)
npm run test:all

# Build frontends
(cd customer-visibility-portal/frontend && npm run build)
(cd dispatch-control-tower/frontend && npm run build)
(cd landing-page && npm run build)
```

---

## Repository Stats

| Metric | Count |
|--------|-------|
| Git commits | 20 |
| TypeScript source files | 357 |
| Total lines of code | ~24,000 |
| Backend services | 6 |
| React frontends | 2 + landing page |
| Passing unit tests | 304 |
| Bruno API requests | 38 |
| k6 load test scripts | 8 |
| Dockerfiles | 6 |
| docker-compose files | 9 |
| PostgreSQL databases | 6 |
| Database tables | 44 |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    nginx gateway :8080                    │
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│ /api/otl │ /api/ntb │ /api/dct │ /api/cvp │ /api/aih    │
│ /api/peob│          │          │ /ws/*    │              │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴──────┬──────┘
     │          │          │          │            │
┌────▼────┐┌────▼────┐┌────▼────┐┌────▼────┐┌─────▼─────┐┌──────────┐
│OTL Core ││Navixy   ││Dispatch ││Customer ││Analytics  ││Plant Edge│
│  :3000  ││Bridge   ││Tower    ││Portal   ││Hub        ││OT Bridge │
│         ││  :3001  ││  :3002  ││  :3003  ││  :3004    ││  :3005   │
│ 61 src  ││ 45 src  ││ 45 src  ││ 48 src  ││ 42 src    ││ 55 src   │
│ 32 tests││ 13 tests││ 25 tests││ 56 tests││ 72 tests  ││106 tests │
└────┬────┘└────┬────┘└────┬────┘└────┬────┘└─────┬─────┘└────┬─────┘
     │          │          │          │            │           │
     └──────────┴──────────┴──────────┴────────────┴───────────┘
                          PostgreSQL 16
                    (6 databases, 44 tables)
```

---

## Service-by-Service Audit

### 1. Order Ticket Load Core (`:3000`)

**Purpose:** Canonical domain — single source of truth for orders, tickets, loads, delivery events.

**Database:** `otl_core` (user: `otl`)

| Table | Purpose |
|-------|---------|
| customers | Customer companies |
| sites | Delivery locations with geofencing |
| jobs | Projects linking customer + site |
| mix_designs | Concrete recipes (PSI, slump, versioned) |
| orders | Commercial orders (DRAFT→CONFIRMED→...) |
| tickets | Operational tickets per order |
| loads | Individual truck loads per ticket |
| delivery_state_events | Immutable event ledger |
| audit_log | Who did what, when |

**Key source files:**
```
src/domain/entities/         — 8 entity interfaces
src/domain/enums/            — 5 enums (LoadStatus, OrderStatus, etc.)
src/domain/value-objects/    — Quantity, GeoPoint, Address
src/domain/errors/           — DomainError, EntityNotFoundError, InvalidTransitionError, etc.
src/application/services/    — CustomerService, OrderService, TicketService, LoadService, etc.
src/infrastructure/repos/    — 9 repositories with toEntity() mapping
src/infrastructure/middleware/ — JWT auth, request-id + correlation-id, error handler
src/interfaces/http/routes/  — 7 route files
src/interfaces/http/schemas/ — Zod validation schemas
```

**API endpoints:**
```
GET  /health
GET  /customers          POST /customers
GET  /customers/:id
GET  /sites              POST /sites
GET  /jobs               POST /jobs
GET  /orders             POST /orders
GET  /orders/:id
GET  /tickets            POST /tickets
GET  /tickets/:id
GET  /loads              POST /loads
GET  /loads/:id
POST /delivery-events
```

**Verify:** `cd order-ticket-load-core && npx tsc --noEmit && npx eslint src/ tests/ && npx vitest run`

---

### 2. Navixy Telematics Bridge (`:3001`)

**Purpose:** GPS/telematics integration — syncs Navixy tracker data, infers geofence transitions, forwards events to OTL Core.

**Database:** `ntb_bridge` (user: `ntb`)

| Table | Purpose |
|-------|---------|
| tracker_assets | GPS tracker devices |
| trips | Vehicle trips from Navixy |
| routes | GPS trace points per trip |
| geofence_zones | Virtual perimeters linked to sites |
| geofence_events | ENTER/EXIT transition records |
| outbound_events | Store-and-forward queue to OTL Core |
| audit_log | Audit trail |

**Key domain logic:**
- Geofence inference engine (`src/domain/services/geofence-inference.ts`) — maps GPS positions to zone transitions, determines delivery state
- Store-and-forward outbound dispatcher with retry logic
- Navixy API client with session management

**Verify:** `cd navixy-telematics-bridge && npx tsc --noEmit && npx eslint src/ tests/ && npx vitest run`

---

### 3. Dispatch Control Tower (`:3002`)

**Purpose:** Operator dashboard — manages truck/driver assignments, exceptions, and the dispatch board.

**Database:** `dct_tower` (user: `dct`)

| Table | Purpose |
|-------|---------|
| trucks | Fleet registry (AVAILABLE/ASSIGNED/MAINTENANCE/...) |
| drivers | Driver registry with license tracking |
| assignments | Load-to-truck-to-driver triplets |
| exceptions | Operational issues (DELAY, NO_SHOW, PLANT_ISSUE, ASSET_ISSUE) |
| dispatch_board | Materialized daily view |
| audit_log | Audit trail |

**Key domain logic:**
- Assignment lifecycle: PENDING → CONFIRMED → IN_PROGRESS → COMPLETED / CANCELLED
- Exception lifecycle: OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → CLOSED
- Cross-service calls to OTL Core and Navixy Bridge

**React frontend** (`frontend/`):
- Dispatch board with date picker, summary cards, assignments table
- Trucks management (add/edit)
- Drivers management (add/edit)
- Exceptions with tab filters and status actions
- Dark sidebar layout

**Verify:** `cd dispatch-control-tower && npx tsc --noEmit && npx eslint src/ tests/ && npx vitest run && cd frontend && npm run build`

---

### 4. Customer Visibility Portal (`:3003`)

**Purpose:** Customer-facing portal — order status, delivery tracking, ETA, messaging.

**Database:** `cvp_portal` (user: `cvp`)

| Table | Purpose |
|-------|---------|
| portal_users | Customer login accounts (scryptSync hashed passwords) |
| order_views | Projected/cached orders from OTL Core |
| ticket_views | Projected tickets |
| load_trackers | Real-time load positions + ETA |
| portal_messages | Delay notices, updates, alerts |
| audit_log | Audit trail |

**Key domain logic:**
- Customer-scoped access — all queries filtered by customerId from JWT
- Sync service pulls from OTL Core and Navixy Bridge
- WebSocket real-time tracking (`src/interfaces/ws/load-tracking-ws.ts`) — pushes every 5s
- Password auth with scryptSync + timingSafeEqual

**React frontend** (`frontend/`):
- Login page with JWT auth
- Orders dashboard (table + mobile cards)
- Order detail with expandable tickets/loads
- Load tracking with 8-step progress stepper, WebSocket with polling fallback
- Messages with severity badges and mark-as-read

**Verify:** `cd customer-visibility-portal && npx tsc --noEmit && npx eslint src/ tests/ && npx vitest run && cd frontend && npm run build`

---

### 5. Analytics Integration Hub (`:3004`)

**Purpose:** Cross-project event bus, KPI computation, ERP export, webhook delivery.

**Database:** `aih_hub` (user: `aih`)

| Table | Purpose |
|-------|---------|
| ingest_events | Canonical event store (idempotent by event_id) |
| kpi_definitions | Registry of computed KPIs |
| kpi_snapshots | Point-in-time metric values |
| erp_export_jobs | Export request tracking |
| webhook_subscriptions | Registered endpoints |
| webhook_deliveries | Delivery log with retry tracking |
| audit_log | Audit trail |

**Key domain logic:**
- Idempotent event ingestion via `ON CONFLICT (event_id) DO NOTHING`
- 5 real KPI computations: loads_per_day, avg_delivery_time_minutes, total_volume_delivered, on_time_delivery_rate, truck_utilization_rate
- HMAC-SHA256 webhook signing (`src/infrastructure/clients/webhook-dispatcher.ts`)
- ERP export generates JSON payloads (invoice, delivery summary, production report)

**Verify:** `cd analytics-integration-hub && npx tsc --noEmit && npx eslint src/ tests/ && npx vitest run`

---

### 6. Plant Edge OT Bridge (`:3005`)

**Purpose:** Edge gateway for plant/mixer telemetry, offline-resilient OT↔IT synchronization.

**Database:** `peob_bridge` (user: `peob`)

| Table | Purpose |
|-------|---------|
| plants | Registered concrete plants with geo |
| mixers | Mixer units (DRUM/CENTRAL/CONTINUOUS) |
| batch_events | Batch lifecycle (STARTED→WEIGHING→MIXING→COMPLETE→LOADED/REJECTED) |
| scale_readings | Weight readings with tolerance checking |
| mixer_status_log | State transitions with validation |
| outbound_events | Store-and-forward queue with exponential backoff |
| heartbeats | Edge device health reports |
| audit_log | Audit trail |

**Key domain logic:**
- Mixer state machine (`src/domain/state-machines/mixer-state-machine.ts`):
  - Valid: IDLE→MIXING, MIXING→IDLE, MIXING→FAULT, FAULT→MAINTENANCE, etc.
  - Invalid transitions throw `InvalidTransitionError`
- Scale tolerance checking: `|actual - target| / target * 100 <= tolerance%`
  - Critical materials (CEMENT, WATER) trigger outbound alerts when out of tolerance
- Exponential backoff: 5s → 30s → 2min → 10min → 1hr, then DEAD_LETTER

**Verify:** `cd plant-edge-ot-bridge && npx tsc --noEmit && npx eslint src/ tests/ && npx vitest run`

---

## Infrastructure Audit

### Docker

**Per-service docker-compose (for standalone development):**
```
order-ticket-load-core/docker-compose.yml     — Postgres on host:5432
navixy-telematics-bridge/docker-compose.yml    — Postgres on host:5433
dispatch-control-tower/docker-compose.yml      — Postgres on host:5434
customer-visibility-portal/docker-compose.yml  — Postgres on host:5435
analytics-integration-hub/docker-compose.yml   — Postgres on host:5436
plant-edge-ot-bridge/docker-compose.yml        — Postgres on host:5437
```

**Root docker-compose.yml:** Orchestrates all 6 services + shared Postgres with `scripts/init-databases.sql`

**Dockerfiles:** Multi-stage builds (node:22-alpine builder → node:22-alpine runtime)

**Verify:** `docker compose config` (validates YAML)

### API Gateway

```
gateway/
├── nginx.conf           — Reverse proxy config
├── docker-compose.yml   — Nginx container
└── README.md
```

Routes: `/api/{otl,ntb,dct,cvp,aih,peob}/*` → respective service
WebSocket: `/ws/*` → CVP :3003

**Verify:** `cd gateway && docker compose config`

### Monitoring

```
monitoring/
├── docker-compose.yml
├── prometheus/prometheus.yml           — Scrape config for all 6 services
├── grafana/provisioning/datasources/   — Auto-configured Prometheus
├── grafana/provisioning/dashboards/    — Dashboard provider
└── grafana/dashboards/overview.json    — SmartFleet Overview dashboard
```

**Verify:** `cd monitoring && docker compose config`

### CI/CD

```
.github/workflows/
├── ci.yml     — Matrix: lint + typecheck + build + test for all 6 services
└── pages.yml  — Deploy landing page to GitHub Pages
```

---

## Testing Audit

### Unit test breakdown

| Project | Tests | Key areas tested |
|---------|-------|------------------|
| order-ticket-load-core | 32 | Load lifecycle state machine, domain entities |
| navixy-telematics-bridge | 13 | Geofence inference, Navixy mapper |
| dispatch-control-tower | 25 | Assignment lifecycle, exception lifecycle |
| customer-visibility-portal | 56 | Auth (password hash/verify), enums, status transitions, load progression |
| analytics-integration-hub | 72 | KPIs, webhooks, HMAC signatures, event sources, export lifecycle |
| plant-edge-ot-bridge | 106 | Mixer state machine (29 transition tests), scale tolerance math, exponential backoff, enums |
| **Total** | **304** | |

### Load tests (k6)

```
load-tests/
├── smoke.js           — 1 VU, 10s, all services health + basic reads
├── load.js            — Ramp to 50 VUs, mixed workload
├── stress.js          — Ramp to 200 VUs, random endpoints
├── otl-core.js        — Focused OTL read/write with custom metrics
├── dispatch-tower.js  — Board + fleet + exceptions
├── analytics-hub.js   — Event ingestion throughput
└── plant-edge.js      — Batch events + scale readings
```

### API collection (Bruno)

```
api-collection/
├── bruno.json                    — Collection manifest
├── environments/local.bru        — Local env (ports 3000-3005)
├── order-ticket-load-core/       — 7 requests
├── navixy-telematics-bridge/     — 5 requests
├── dispatch-control-tower/       — 8 requests
├── customer-visibility-portal/   — 5 requests
├── analytics-integration-hub/    — 6 requests
└── plant-edge-ot-bridge/         — 7 requests
```

---

## Shared Patterns (all 6 services)

Every service follows identical patterns:

| Pattern | Implementation |
|---------|---------------|
| Language | TypeScript 5.8, ES modules, `.js` import extensions |
| Runtime | Node.js 22+ |
| Framework | Fastify 5.2.1 |
| Database | PostgreSQL 16 via Knex |
| Validation | Zod schemas |
| Auth | JWT Bearer tokens |
| Entities | Interfaces (not classes) |
| Repositories | Private `toEntity()` mapping, `trx?` transaction support |
| Mutations | Always wrapped in `db.transaction()` |
| Audit | Every mutation logged to `audit_log` table |
| Errors | `DomainError` → `EntityNotFoundError`, `InvalidTransitionError`, `ValidationError` |
| Error handling | Fastify error handler maps domain errors to HTTP status codes |
| CORS | `@fastify/cors` with credentials |
| Rate limiting | `@fastify/rate-limit` at 100 req/min |
| Tracing | `x-request-id` + `x-correlation-id` on all requests/responses |
| Docs | OpenAPI/Swagger UI at `/docs` |
| Config | Zod env schema with development defaults |
| Testing | Vitest |
| Linting | ESLint + typescript-eslint |

---

## Seed Data Story

The seed data tells a coherent story of a concrete delivery morning:

- **Two customers:** Acme Construction, BuildRight Corp
- **Two plants:** Riverside Plant, Downtown Plant
- **Four trucks:** TRK-101 through 104
- **Four drivers:** Carlos Rodriguez, Maria Santos, James Mitchell, Robert Chen
- **Three orders** across different jobs
- **Six loads** in various states:
  - Load 1: COMPLETED (delivered and done)
  - Load 2: POURING (on site, pouring concrete)
  - Load 3: EN_ROUTE (in transit with traffic delay exception)
  - Load 4: LOADING (at plant, being batched)
  - Loads 5-6: SCHEDULED (upcoming)

Cross-service references use deterministic UUIDs (`11111111-1111-1111-1111-111111XXXXXX`) so all services can reference the same entities.

---

## Links

- **GitHub:** https://github.com/DonTicapo/smartfleet-dispatch-portfolio
- **Landing Page:** https://donticapo.github.io/smartfleet-dispatch-portfolio/
- **Database ERDs:** [docs/database-erd.md](./database-erd.md)
- **API Reference:** [docs/api/index.html](./api/index.html)
