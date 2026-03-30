# Database Schema -- SmartFleet Dispatch Portfolio

6 PostgreSQL databases across 6 bounded-context microservices.

Each database uses the `pgcrypto` extension for `gen_random_uuid()`. Every database
includes a shared `audit_log` table pattern. Foreign key relationships are internal
to each service; cross-service references use stable text identifiers (never direct
FK pointers) to preserve bounded-context autonomy.

---

## Order Ticket Load Core (`otl_core`)

Canonical domain platform: customers, jobs, sites, orders, tickets, loads, mix
designs, and delivery-state events.

**Port:** 3100

```mermaid
erDiagram
    customers {
        uuid id PK
        text external_id UK
        text name
        text contact_email
        text contact_phone
        jsonb billing_address
        timestamptz created_at
        timestamptz updated_at
    }

    sites {
        uuid id PK
        uuid customer_id FK
        text name
        jsonb address
        jsonb geo_point
        integer geofence_radius_meters
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    jobs {
        uuid id PK
        uuid customer_id FK
        uuid site_id FK
        text name
        text description
        date start_date
        date end_date
        timestamptz created_at
        timestamptz updated_at
    }

    mix_designs {
        uuid id PK
        text code
        text name
        text description
        integer strength_psi
        numeric slump_inches
        integer version
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    orders {
        uuid id PK
        text external_id UK
        uuid customer_id FK
        uuid job_id FK
        uuid mix_design_id FK
        numeric requested_quantity_amount
        text requested_quantity_unit
        date requested_delivery_date
        text requested_delivery_time
        text special_instructions
        text status
        text created_by
        timestamptz created_at
        timestamptz updated_at
    }

    tickets {
        uuid id PK
        uuid order_id FK
        text ticket_number UK
        text status
        date scheduled_date
        text plant_id
        text notes
        text created_by
        timestamptz created_at
        timestamptz updated_at
    }

    loads {
        uuid id PK
        uuid ticket_id FK
        integer load_number
        text truck_id
        text driver_id
        uuid mix_design_id FK
        numeric actual_quantity_amount
        text actual_quantity_unit
        text status
        timestamptz batched_at
        timestamptz departed_plant_at
        timestamptz arrived_site_at
        timestamptz pour_started_at
        timestamptz pour_completed_at
        timestamptz returned_plant_at
        timestamptz created_at
        timestamptz updated_at
    }

    delivery_state_events {
        uuid id PK
        text event_id UK
        uuid load_id FK
        text state
        timestamptz occurred_at
        text source
        text source_event_id
        jsonb payload
        timestamptz received_at
    }

    audit_log {
        uuid id PK
        text entity_type
        uuid entity_id
        text action
        text actor
        jsonb changes
        text request_id
        timestamptz created_at
    }

    customers ||--o{ sites : "has"
    customers ||--o{ jobs : "has"
    customers ||--o{ orders : "places"
    sites ||--o{ jobs : "hosts"
    jobs ||--o{ orders : "contains"
    mix_designs ||--o{ orders : "specifies"
    mix_designs ||--o{ loads : "batched as"
    orders ||--o{ tickets : "splits into"
    tickets ||--o{ loads : "dispatched as"
    loads ||--o{ delivery_state_events : "tracks"
```

**Unique constraints:**
- `mix_designs(code, version)` -- composite unique
- `loads(ticket_id, load_number)` -- composite unique

---

## Navixy Telematics Bridge (`ntb_bridge`)

Integration layer turning Navixy GPS assets, positions, geofence events, trips,
and routes into canonical dispatch telemetry.

**Port:** 3200

```mermaid
erDiagram
    tracker_assets {
        uuid id PK
        integer navixy_tracker_id UK
        text label
        text truck_id
        text model
        text status
        numeric last_latitude
        numeric last_longitude
        timestamptz last_position_at
        integer navixy_group_id
        timestamptz synced_at
        timestamptz created_at
        timestamptz updated_at
    }

    positions {
        uuid id PK
        uuid tracker_asset_id FK
        numeric latitude
        numeric longitude
        numeric altitude
        numeric speed
        numeric heading
        numeric accuracy
        timestamptz recorded_at
        timestamptz received_at
    }

    trips {
        uuid id PK
        uuid tracker_asset_id FK
        integer navixy_trip_id
        timestamptz start_at
        timestamptz end_at
        numeric start_latitude
        numeric start_longitude
        numeric end_latitude
        numeric end_longitude
        integer distance_meters
        text status
        uuid load_id
        timestamptz synced_at
        timestamptz created_at
        timestamptz updated_at
    }

    routes {
        uuid id PK
        uuid trip_id FK "UK"
        jsonb points
        timestamptz fetched_at
    }

    geofence_zones {
        uuid id PK
        integer navixy_geofence_id UK
        text name
        text zone_type
        numeric latitude
        numeric longitude
        integer radius_meters
        uuid site_id
        text plant_id
        timestamptz created_at
        timestamptz updated_at
    }

    geofence_events {
        uuid id PK
        uuid tracker_asset_id FK
        uuid geofence_zone_id FK
        text transition
        numeric latitude
        numeric longitude
        timestamptz occurred_at
        text navixy_event_id UK
        timestamptz processed_at
        timestamptz created_at
    }

    outbound_events {
        uuid id PK
        text event_type
        text target_url
        jsonb payload
        text status
        integer attempts
        timestamptz last_attempt_at
        text last_error
        timestamptz next_retry_at
        timestamptz created_at
        timestamptz updated_at
    }

    audit_log {
        uuid id PK
        text entity_type
        uuid entity_id
        text action
        text actor
        jsonb changes
        text request_id
        timestamptz created_at
    }

    tracker_assets ||--o{ positions : "emits"
    tracker_assets ||--o{ trips : "records"
    tracker_assets ||--o{ geofence_events : "triggers"
    trips ||--|| routes : "has"
    geofence_zones ||--o{ geofence_events : "detects"
```

**Unique constraints:**
- `trips(tracker_asset_id, navixy_trip_id)` -- composite unique
- `routes(trip_id)` -- one route per trip

**Cross-service references (text, not FK):**
- `tracker_assets.truck_id` --> OTL `loads.truck_id`
- `trips.load_id` --> OTL `loads.id`
- `geofence_zones.site_id` --> OTL `sites.id`
- `geofence_zones.plant_id` --> PEOB `plants.code`

---

## Dispatch Control Tower (`dct_tower`)

Operational cockpit for dispatchers: truck/driver assignment, live load lifecycle,
exception handling, and the materialized dispatch board.

**Port:** 3300

```mermaid
erDiagram
    trucks {
        uuid id PK
        text external_id UK
        text number UK
        text license_plate
        numeric capacity_amount
        text capacity_unit
        text status
        text home_plant_id
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    drivers {
        uuid id PK
        text external_id UK
        text first_name
        text last_name
        text phone
        text license_number
        text status
        uuid default_truck_id FK
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    assignments {
        uuid id PK
        text load_id
        uuid truck_id FK
        uuid driver_id FK
        text status
        text assigned_by
        timestamptz assigned_at
        timestamptz confirmed_at
        timestamptz completed_at
        timestamptz cancelled_at
        text cancellation_reason
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    dispatch_exceptions {
        uuid id PK
        text load_id
        uuid assignment_id FK
        uuid truck_id FK
        text type
        text severity
        text status
        text title
        text description
        text reported_by
        text resolved_by
        timestamptz resolved_at
        text resolution
        timestamptz created_at
        timestamptz updated_at
    }

    dispatch_board {
        uuid id PK
        date date
        text load_id
        text order_id
        text ticket_id
        text ticket_number
        text customer_name
        text site_name
        text mix_design_code
        numeric requested_quantity_amount
        text requested_quantity_unit
        text load_status
        uuid truck_id FK
        text truck_number
        uuid driver_id FK
        text driver_name
        uuid assignment_id FK
        text assignment_status
        text scheduled_time
        boolean has_exceptions
        timestamptz last_refreshed_at
    }

    audit_log {
        uuid id PK
        text entity_type
        uuid entity_id
        text action
        text actor
        jsonb changes
        text request_id
        timestamptz created_at
    }

    trucks ||--o{ drivers : "default truck"
    trucks ||--o{ assignments : "assigned to"
    drivers ||--o{ assignments : "drives"
    assignments ||--o{ dispatch_exceptions : "raises"
    trucks ||--o{ dispatch_exceptions : "involves"
    trucks ||--o{ dispatch_board : "on board"
    drivers ||--o{ dispatch_board : "on board"
    assignments ||--o{ dispatch_board : "shown as"
```

**Unique constraints:**
- `dispatch_board(date, load_id)` -- composite unique
- Partial unique index `idx_assignments_active_load`: one active assignment per
  `load_id` where `status NOT IN ('CANCELLED', 'COMPLETED')`

**Cross-service references (text, not FK):**
- `assignments.load_id` --> OTL `loads.id`
- `dispatch_exceptions.load_id` --> OTL `loads.id`
- `dispatch_board.load_id` --> OTL `loads.id`
- `dispatch_board.order_id` --> OTL `orders.id`
- `dispatch_board.ticket_id` --> OTL `tickets.id`
- `dispatch_board.ticket_number` --> OTL `tickets.ticket_number`
- `trucks.home_plant_id` --> PEOB `plants.code`

---

## Customer Visibility Portal (`cvp_portal`)

Customer-facing portal for order status, delivery tracking, ETA visibility, and
project-level communication. Uses read-model projections synced from OTL and NTB.

**Port:** 3400

```mermaid
erDiagram
    portal_users {
        uuid id PK
        uuid customer_id
        text email UK
        text name
        text role
        text password_hash
        timestamptz last_login_at
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    order_views {
        uuid id PK
        text external_order_id UK
        uuid customer_id
        text job_name
        text site_name
        text mix_design_name
        numeric requested_quantity_amount
        text requested_quantity_unit
        date requested_delivery_date
        text status
        timestamptz last_synced_at
        timestamptz created_at
        timestamptz updated_at
    }

    ticket_views {
        uuid id PK
        text external_ticket_id UK
        uuid order_id FK
        text ticket_number
        text status
        date scheduled_date
        text plant_id
        timestamptz last_synced_at
        timestamptz created_at
        timestamptz updated_at
    }

    load_trackers {
        uuid id PK
        text external_load_id UK
        uuid ticket_id FK
        integer load_number
        text truck_id
        text driver_id
        text status
        numeric current_lat
        numeric current_lon
        integer eta_minutes
        timestamptz last_position_at
        timestamptz last_synced_at
        timestamptz created_at
        timestamptz updated_at
    }

    portal_messages {
        uuid id PK
        uuid customer_id
        uuid order_id
        text subject
        text body
        text severity
        boolean is_read
        text created_by
        timestamptz created_at
    }

    audit_log {
        uuid id PK
        text entity_type
        uuid entity_id
        text action
        text actor
        jsonb changes
        text request_id
        timestamptz created_at
    }

    order_views ||--o{ ticket_views : "contains"
    ticket_views ||--o{ load_trackers : "tracks"
```

**Cross-service references (text/uuid, not FK):**
- `portal_users.customer_id` --> OTL `customers.id`
- `order_views.external_order_id` --> OTL `orders.external_id`
- `order_views.customer_id` --> OTL `customers.id`
- `ticket_views.external_ticket_id` --> OTL `tickets.id`
- `load_trackers.external_load_id` --> OTL `loads.id`
- `portal_messages.customer_id` --> OTL `customers.id`
- `portal_messages.order_id` --> OTL `orders.id`

---

## Analytics Integration Hub (`aih_hub`)

Cross-project event bus, KPI computation, ERP/reporting adapters, webhook delivery,
and observability backbone.

**Port:** 3500

```mermaid
erDiagram
    ingest_events {
        uuid id PK
        text event_id UK
        text source
        text event_type
        text aggregate_type
        text aggregate_id
        jsonb payload
        timestamptz occurred_at
        timestamptz received_at
        timestamptz processed_at
    }

    kpi_definitions {
        uuid id PK
        text name UK
        text display_name
        text description
        text unit
        text dimension
        text formula
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    kpi_snapshots {
        uuid id PK
        text kpi_name
        text dimension
        text dimension_id
        numeric value
        text unit
        timestamptz period_start
        timestamptz period_end
        timestamptz computed_at
        timestamptz created_at
    }

    erp_export_jobs {
        uuid id PK
        text export_type
        text status
        jsonb filters
        text result_url
        text error_message
        text requested_by
        timestamptz started_at
        timestamptz completed_at
        timestamptz created_at
    }

    webhook_subscriptions {
        uuid id PK
        text url
        text_array event_types
        text secret
        boolean is_active
        timestamptz last_delivered_at
        integer failure_count
        timestamptz created_at
        timestamptz updated_at
    }

    webhook_deliveries {
        uuid id PK
        uuid subscription_id FK
        text event_id
        text status
        integer http_status
        text response_body
        integer attempts
        timestamptz last_attempt_at
        timestamptz created_at
    }

    audit_log {
        uuid id PK
        text entity_type
        uuid entity_id
        text action
        text actor
        jsonb changes
        text request_id
        timestamptz created_at
    }

    webhook_subscriptions ||--o{ webhook_deliveries : "delivers"
```

**Cross-service references (text, not FK):**
- `ingest_events.source` -- identifies originating service (e.g. `otl_core`, `ntb_bridge`, `peob_bridge`)
- `ingest_events.aggregate_type` / `aggregate_id` -- references entities from any service
- `kpi_snapshots.dimension` / `dimension_id` -- references plants, trucks, drivers, customers across services

---

## Plant Edge OT Bridge (`peob_bridge`)

Edge gateway and plant integration layer for batching, mixer telemetry, scale
readings, and offline-resilient OT-to-IT synchronization.

**Port:** 3600

```mermaid
erDiagram
    plants {
        uuid id PK
        text code UK
        text name
        jsonb location
        text timezone
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    mixers {
        uuid id PK
        uuid plant_id FK
        text code
        text name
        text type
        numeric capacity_cy
        text status
        timestamptz last_status_at
        timestamptz created_at
        timestamptz updated_at
    }

    batch_events {
        uuid id PK
        text event_id UK
        uuid plant_id FK
        uuid mixer_id FK
        text ticket_number
        text batch_number
        text event_type
        jsonb payload
        timestamptz occurred_at
        timestamptz received_at
    }

    scale_readings {
        uuid id PK
        uuid plant_id FK
        uuid mixer_id FK
        text batch_number
        text material_type
        numeric target_weight
        numeric actual_weight
        text unit
        numeric tolerance
        boolean within_tolerance
        timestamptz recorded_at
        timestamptz received_at
    }

    mixer_status_log {
        uuid id PK
        uuid plant_id FK
        uuid mixer_id FK
        text previous_status
        text current_status
        text reason
        text operator_id
        timestamptz occurred_at
        timestamptz received_at
    }

    outbound_events {
        uuid id PK
        text event_type
        jsonb payload
        text target_service
        text status
        integer attempts
        integer max_attempts
        timestamptz last_attempt_at
        timestamptz next_retry_at
        timestamptz sent_at
        timestamptz created_at
    }

    heartbeats {
        uuid id PK
        uuid plant_id FK
        integer uptime_seconds
        numeric cpu_percent
        numeric memory_percent
        numeric disk_percent
        integer pending_outbound
        timestamptz last_cloud_sync_at
        timestamptz reported_at
    }

    audit_log {
        uuid id PK
        text entity_type
        uuid entity_id
        text action
        text actor
        jsonb changes
        text request_id
        timestamptz created_at
    }

    plants ||--o{ mixers : "contains"
    plants ||--o{ batch_events : "produces"
    plants ||--o{ scale_readings : "weighs"
    plants ||--o{ mixer_status_log : "monitors"
    plants ||--o{ heartbeats : "reports"
    mixers ||--o{ batch_events : "batches"
    mixers ||--o{ scale_readings : "measures"
    mixers ||--o{ mixer_status_log : "transitions"
```

**Unique constraints:**
- `mixers(plant_id, code)` -- composite unique

**Cross-service references (text, not FK):**
- `batch_events.ticket_number` --> OTL `tickets.ticket_number`

---

## Cross-Service Reference Map

Services do **not** share a database. They reference each other via stable, immutable
identifiers passed through event payloads and denormalized into local read-model
columns. No service holds a foreign key into another service's database.

```
OTL (Source of Truth)
  |
  |-- customers.id ---------> CVP portal_users.customer_id
  |                            CVP order_views.customer_id
  |                            CVP portal_messages.customer_id
  |
  |-- orders.id / external_id -> CVP order_views.external_order_id
  |                              DCT dispatch_board.order_id
  |                              CVP portal_messages.order_id
  |
  |-- tickets.id / ticket_number -> CVP ticket_views.external_ticket_id
  |                                 DCT dispatch_board.ticket_id / ticket_number
  |                                 PEOB batch_events.ticket_number
  |
  |-- loads.id -----------------> DCT assignments.load_id
  |                               DCT dispatch_exceptions.load_id
  |                               DCT dispatch_board.load_id
  |                               CVP load_trackers.external_load_id
  |                               NTB trips.load_id
  |
  |-- loads.truck_id / driver_id -> NTB tracker_assets.truck_id
  |
  |-- sites.id -----------------> NTB geofence_zones.site_id
  |
  PEOB plants.code
  |-- --------------------------> NTB geofence_zones.plant_id
  |                               DCT trucks.home_plant_id
  |
  AIH ingest_events
  |-- source / aggregate_type / aggregate_id --> any entity from any service
```

### Reference Flow Summary

| From Service | Column(s) | To Service | Target Entity |
|---|---|---|---|
| NTB | `tracker_assets.truck_id` | OTL | `loads.truck_id` |
| NTB | `trips.load_id` | OTL | `loads.id` |
| NTB | `geofence_zones.site_id` | OTL | `sites.id` |
| NTB | `geofence_zones.plant_id` | PEOB | `plants.code` |
| DCT | `assignments.load_id` | OTL | `loads.id` |
| DCT | `dispatch_exceptions.load_id` | OTL | `loads.id` |
| DCT | `dispatch_board.load_id` | OTL | `loads.id` |
| DCT | `dispatch_board.order_id` | OTL | `orders.id` |
| DCT | `dispatch_board.ticket_id` | OTL | `tickets.id` |
| DCT | `dispatch_board.ticket_number` | OTL | `tickets.ticket_number` |
| DCT | `trucks.home_plant_id` | PEOB | `plants.code` |
| CVP | `portal_users.customer_id` | OTL | `customers.id` |
| CVP | `order_views.external_order_id` | OTL | `orders.external_id` |
| CVP | `order_views.customer_id` | OTL | `customers.id` |
| CVP | `ticket_views.external_ticket_id` | OTL | `tickets.id` |
| CVP | `load_trackers.external_load_id` | OTL | `loads.id` |
| CVP | `portal_messages.customer_id` | OTL | `customers.id` |
| CVP | `portal_messages.order_id` | OTL | `orders.id` |
| PEOB | `batch_events.ticket_number` | OTL | `tickets.ticket_number` |
| AIH | `ingest_events.aggregate_id` | Any | Referenced entity by `aggregate_type` |

### Table Counts by Service

| Service | Tables | Description |
|---|---|---|
| OTL Core | 9 | customers, sites, jobs, mix_designs, orders, tickets, loads, delivery_state_events, audit_log |
| NTB Bridge | 8 | tracker_assets, positions, trips, routes, geofence_zones, geofence_events, outbound_events, audit_log |
| DCT Tower | 6 | trucks, drivers, assignments, dispatch_exceptions, dispatch_board, audit_log |
| CVP Portal | 6 | portal_users, order_views, ticket_views, load_trackers, portal_messages, audit_log |
| AIH Hub | 7 | ingest_events, kpi_definitions, kpi_snapshots, erp_export_jobs, webhook_subscriptions, webhook_deliveries, audit_log |
| PEOB Bridge | 8 | plants, mixers, batch_events, scale_readings, mixer_status_log, outbound_events, heartbeats, audit_log |
| **Total** | **44** | |
