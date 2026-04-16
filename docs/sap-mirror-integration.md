# SAP Mirror Integration — SmartFleet Dispatch

## Architecture Decision

SmartFleet reads SAP B1 data from the **`sap_mirror` PostgreSQL database** (port 5433) maintained by the Platino Intelligence .NET SapSyncService. This mirror refreshes every 5–15 minutes via incremental upserts.

- **Reads:** SQL queries against `sap_mirror` tables (this document)
- **Writes:** SAP B1 Service Layer REST API — addressed separately

The connector lives in **analytics-integration-hub** (port 3004).

---

## sap_mirror Table Structure

Three tables, all using JSONB `Data` columns:

| Table | Entity Types | Key Columns |
|-------|-------------|-------------|
| `sap_master_data` | BusinessPartners, Items | CompanyDb, EntityType, EntityKey, Data (JSONB), CardType, SyncedAt |
| `sap_documents` | Orders, Invoices, DeliveryNotes, CreditNotes, PurchaseOrders, PurchaseInvoices, PurchaseDeliveryNotes, InventoryGenExits | CompanyDb, EntityType, EntityKey, Data (JSONB), DocEntry, DocDate, DocCurrency, DocTotal, CardCode, Cancelled, SyncedAt |
| `sap_reference_data` | Warehouses, ItemGroups, SalesPersons, PriceLists, SpecialPrices, PaymentTermsTypes, BusinessPartnerGroups | CompanyDb, EntityType, EntityKey, Data (JSONB), SyncedAt |

---

## Inbound Mappings (SAP Mirror → SmartFleet)

### 1. Customers — `sap_master_data` WHERE EntityType='BusinessPartners' AND CardType='cCustomer'

| SmartFleet (otl_core.customers) | SAP Mirror JSONB Path | SQL Example | Notes |
|---------------------------------|----------------------|-------------|-------|
| `external_id` (TEXT UNIQUE) | `"Data"->>'CardCode'` | `"Data"->>'CardCode'` | Primary lookup key, e.g. `CNAC-04145` |
| `name` (TEXT) | `"Data"->>'CardName'` | `"Data"->>'CardName'` | Company name |
| `contact_email` (TEXT) | `"Data"->>'EmailAddress'` | `"Data"->>'EmailAddress'` | May be null |
| `contact_phone` (TEXT) | `"Data"->>'Phone1'` | `"Data"->>'Phone1'` | Primary phone |
| `billing_address` (JSONB) | `"Data"->'BPAddresses'` | See query below | Filter where `AddressType = 'bo_BillTo'` |

**Query: Sync customers**
```sql
SELECT
  "Data"->>'CardCode'      AS external_id,
  "Data"->>'CardName'      AS name,
  "Data"->>'EmailAddress'  AS contact_email,
  "Data"->>'Phone1'        AS contact_phone,
  "Data"->'BPAddresses'    AS addresses_json
FROM sap_master_data
WHERE "CompanyDb" = $1
  AND "EntityType" = 'BusinessPartners'
  AND "Data"->>'CardType' = 'cCustomer'
  AND ("Data"->>'Frozen') IS DISTINCT FROM 'tYES'
ORDER BY "SyncedAt" DESC;
```

**Billing address extraction** (from `addresses_json`):
```sql
SELECT jsonb_array_elements("Data"->'BPAddresses') AS addr
-- then filter: addr->>'AddressType' = 'bo_BillTo'
-- map to: { street, city, state, zipCode, country }
```

---

### 2. Sites — `sap_master_data` WHERE EntityType='BusinessPartners' → BPAddresses (ShipTo)

| SmartFleet (otl_core.sites) | SAP Mirror JSONB Path | Notes |
|-----------------------------|----------------------|-------|
| `customer_id` (FK) | Resolved via `CardCode` → customers.external_id | Join locally |
| `name` (TEXT) | `addr->>'AddressName'` | Delivery location name |
| `address` (JSONB) | `addr->>'Street'`, `City`, `State`, `ZipCode`, `Country` | Compose JSONB object |
| `geo_point` (JSONB) | **NOT IN SAP** | Must be set manually in SmartFleet or geocoded |
| `geofence_radius_meters` (INT) | **NOT IN SAP** | SmartFleet-specific, default 200m |

**Query: Extract ship-to addresses per customer**
```sql
SELECT
  "Data"->>'CardCode' AS customer_card_code,
  addr->>'AddressName' AS site_name,
  jsonb_build_object(
    'street', addr->>'Street',
    'city',   addr->>'City',
    'state',  addr->>'State',
    'zip',    addr->>'ZipCode',
    'country',addr->>'Country'
  ) AS address
FROM sap_master_data,
LATERAL jsonb_array_elements("Data"->'BPAddresses') AS addr
WHERE "CompanyDb" = $1
  AND "EntityType" = 'BusinessPartners'
  AND "Data"->>'CardType' = 'cCustomer'
  AND addr->>'AddressType' = 'bo_ShipTo';
```

---

### 3. Mix Designs — `sap_master_data` WHERE EntityType='Items' AND ItemsGroupCode=113

270 concrete items in Duracreto. Group 113 = "CONCRETOS".

| SmartFleet (otl_core.mix_designs) | SAP Mirror JSONB Path | Notes |
|-----------------------------------|----------------------|-------|
| `code` (TEXT) | `"Data"->>'ItemCode'` | e.g. `CON00066` (prefix `CON`) |
| `name` (TEXT) | `"Data"->>'ItemName'` | e.g. `CONCRETO 3500 3/4" AC 1 TGU` |
| `description` (TEXT) | `"Data"->>'ForeignName'` | Same as ItemName (or `User_Text` if set) |
| `strength_psi` (INT) | Parsed from `ItemName` | Regex: `CONCRETO (\d+)` → e.g. 3500 |
| `slump_inches` (DECIMAL) | **NOT AVAILABLE** | Not in SAP data; set null or default |
| `version` | Default `1` | SmartFleet-specific |
| `is_active` | `"Data"->>'Valid' = 'tYES'` AND `Frozen = 'tNO'` | |

**UoM:** All concrete items use **M3** (cubic meters). SmartFleet default should be `M3`.

**Query: Sync concrete mix items**
```sql
SELECT
  "Data"->>'ItemCode'  AS code,
  "Data"->>'ItemName'  AS name,
  COALESCE(NULLIF("Data"->>'User_Text', ''), "Data"->>'ItemName') AS description,
  -- Parse strength from name: "CONCRETO 3500 ..." → 3500
  (regexp_match("Data"->>'ItemName', 'CONCRETO\s+(\d+)'))[1]::integer AS strength_psi,
  "Data"->>'SalesUnit' AS uom,
  "Data"->>'Valid'      AS valid,
  "Data"->>'Frozen'     AS frozen
FROM sap_master_data
WHERE "CompanyDb" = 'SBO_DURACRETO1'
  AND "EntityType" = 'Items'
  AND ("Data"->>'ItemsGroupCode')::int = 113
  AND "Data"->>'Valid' = 'tYES'
  AND "Data"->>'Frozen' = 'tNO'
ORDER BY "Data"->>'ItemCode';
```

---

### 4. Orders — `sap_documents` WHERE EntityType='Orders'

| SmartFleet (otl_core.orders) | SAP Mirror JSONB/Column | Notes |
|------------------------------|------------------------|-------|
| `external_id` (TEXT) | `"DocEntry"` or `"Data"->>'DocNum'` | DocEntry is stable PK; DocNum is human-readable |
| `customer_id` (FK) | `"CardCode"` → customers.external_id | Top-level column on sap_documents |
| `mix_design_id` (FK) | `line->>'ItemCode'` → mix_designs.code | From DocumentLines[0] |
| `requested_quantity_amount` (DECIMAL) | `(line->>'Quantity')::numeric` | First line item |
| `requested_quantity_unit` (TEXT) | `line->>'MeasureUnit'` | Map SAP UoM → CY/CM |
| `requested_delivery_date` (DATE) | `("Data"->>'DocDueDate')::date` | |
| `requested_delivery_time` (TEXT) | `"Data"->>'U_SF_DeliveryTime'` | **UDF — likely doesn't exist yet** |
| `special_instructions` (TEXT) | `"Data"->>'U_SF_Instructions'` | **UDF — likely doesn't exist yet** |
| `status` (TEXT) | Derived from `"Data"->>'DocumentStatus'` + `"Cancelled"` | See mapping below |

**Status mapping:**
| SAP DocumentStatus | SAP Cancelled | SmartFleet Status |
|-------------------|---------------|-------------------|
| `bost_Open` | `tNO` | `CONFIRMED` |
| `bost_Close` | `tNO` | `COMPLETED` |
| any | `tYES` | `CANCELLED` |

**Query: Sync open sales orders**
```sql
SELECT
  "DocEntry"::text                            AS external_id,
  "Data"->>'DocNum'                           AS doc_num,
  "CardCode"                                  AS customer_card_code,
  ("Data"->>'DocDueDate')::date               AS requested_delivery_date,
  "Data"->>'DocumentStatus'                   AS doc_status,
  "Cancelled"                                 AS cancelled,
  jsonb_array_elements("Data"->'DocumentLines') AS line
FROM sap_documents
WHERE "CompanyDb" = $1
  AND "EntityType" = 'Orders'
  AND "Cancelled" = 'tNO'
  AND "Data"->>'DocumentStatus' = 'bost_Open'
  AND "SyncedAt" > $2  -- incremental: only records synced after last poll
ORDER BY "DocDate" DESC;
```

> **Note on multi-line orders:** A SAP Sales Order can have multiple DocumentLines (multiple mix designs). SmartFleet models one order = one mix design. Options:
> 1. Split multi-line SAP orders into multiple SmartFleet orders (one per line)
> 2. Only sync the first line and log a warning for multi-line orders
> Decision needed.

---

### 5. Plants — `sap_reference_data` WHERE EntityType='Warehouses' (whitelist)

109 warehouses exist but only 8 are concrete production plants.

| SmartFleet (peob_bridge.plants) | SAP Mirror JSONB Path | Notes |
|---------------------------------|----------------------|-------|
| `code` (TEXT) | `"Data"->>'WarehouseCode'` | e.g. `SPSPT`, `TGUPT` |
| `name` (TEXT) | `"Data"->>'WarehouseName'` | e.g. `ALMACEN CONCRETOS SPS PRODUCTO TERMINADO` |
| `location` (JSONB) | **NOT IN SAP** | Must be set manually or geocoded from city name |
| `timezone` (TEXT) | Default `America/Tegucigalpa` | All plants are in Honduras |
| `is_active` | `("Data"->>'Inactive') IS DISTINCT FROM 'tYES'` | |

**Query: Sync concrete plants (whitelist)**
```sql
SELECT
  "Data"->>'WarehouseCode' AS code,
  "Data"->>'WarehouseName' AS name
FROM sap_reference_data
WHERE "CompanyDb" = 'SBO_DURACRETO1'
  AND "EntityType" = 'Warehouses'
  AND "Data"->>'WarehouseCode' IN (
    'SPSPT',   -- San Pedro Sula
    'TGUPT',   -- Tegucigalpa
    'CORPT',   -- Puerto Cortés
    'CEIPT',   -- La Ceiba
    'CSJPT',   -- San Jorge
    'CHOPT',   -- Choloma
    'SBCPT',   -- Santa Bárbara
    'STELPT'   -- Santa Elena
  );
```

---

### 6. Reference Data for KPIs

#### SalesPersons (for analytics)
```sql
SELECT
  "Data"->>'SalesEmployeeCode' AS code,
  "Data"->>'SalesEmployeeName' AS name
FROM sap_reference_data
WHERE "CompanyDb" = $1 AND "EntityType" = 'SalesPersons';
```

#### ItemGroups (for material classification)
```sql
SELECT
  "Data"->>'Number'    AS group_code,
  "Data"->>'GroupName' AS group_name
FROM sap_reference_data
WHERE "CompanyDb" = $1 AND "EntityType" = 'ItemGroups';
```

#### PriceLists (for order pricing)
```sql
SELECT
  "Data"->>'PriceListNo' AS list_id,
  "Data"->>'PriceListName' AS name
FROM sap_reference_data
WHERE "CompanyDb" = $1 AND "EntityType" = 'PriceLists';
```

---

### 7. Existing Materialized Views (reusable for analytics)

These MVs already exist in `sap_mirror` and can be queried directly by AIH for KPI computation:

| MV | Rows | SmartFleet Use |
|----|------|----------------|
| `mv_ventas_factura_lineas` | ~370K | Revenue analytics — sales by item, customer, salesperson, period |
| `mv_compras_factura_lineas` | ~280K | Cost analytics — purchases by supplier, item, warehouse |
| `mv_consumo_inventario_mes` | ~50K | Material consumption — monthly aggregates by item/warehouse |

**Example: Monthly revenue by concrete mix**
```sql
SELECT
  item_code, item_descripcion,
  mes,
  SUM(line_total) AS revenue,
  SUM(cantidad) AS volume
FROM mv_ventas_factura_lineas
WHERE company_db = $1
  AND mes >= '2026-01-01'
GROUP BY item_code, item_descripcion, mes
ORDER BY mes, revenue DESC;
```

---

## Outbound Mappings (SmartFleet → SAP) — WRITE, SEPARATE PHASE

These require SAP B1 Service Layer API calls (not sap_mirror reads). Documented here for completeness; implementation deferred.

| SmartFleet Event | SAP B1 Object | Trigger |
|-----------------|----------------|---------|
| Load COMPLETED | `POST /DeliveryNotes` | load.status → RETURNED_TO_PLANT |
| Batch LOADED | `POST /InventoryGenExits` | batch_event.event_type = BATCH_LOADED |
| Daily invoice run | `POST /Invoices` (BaseType: 15 from DeliveryNotes) | Scheduled or manual via AIH |
| Order status update | `PATCH /Orders/{DocEntry}` | Bidirectional status sync |

---

## Probe Results (verified 2026-04-16 against live sap_mirror)

### G1: CompanyDb — CONFIRMED: `SBO_DURACRETO1`

Duracreto is the concrete company. Mirror contains **6,419 BusinessPartners** and **9,081 Items**.
- 4,904 customers, 1,515 suppliers
- 11 document entity types with 238K+ documents (83K DeliveryNotes, 36K Invoices, 11K Orders)

### G2: ItemsGroupCode — RESOLVED

| Group Code | Group Name | Item Count | Notes |
|------------|-----------|------------|-------|
| **113** | **CONCRETOS** | **270** | Concrete mixes — primary sync target |
| 124 | SERVICIOS COLOCACION | 88 | Placement/pouring services (sync optional) |
| 110 | SERVICIOS | 1 | General services |

**Filter:** `("Data"->>'ItemsGroupCode')::int = 113` for concrete products.

### G3: UDFs on Items — NOT PRESENT

`U_Strength` and `U_Slump` do **not** exist in the mirror JSONB. Available keys:
```
AvgStdPrice, BarCode, CreateDate, DefaultWarehouse, ForeignName, Frozen,
InventoryItem, InventoryUOM, InventoryUoMEntry, InventoryWeight, InventoryWeightUnit,
ItemCode, ItemName, ItemsGroupCode, ItemType, ManageBatchNumbers, ManageSerialNumbers,
Manufacturer, PurchaseItem, PurchaseUnit, QuantityOnStock,
QuantityOrderedByCustomers, QuantityOrderedFromVendors, SalesItem, SalesUnit,
UoMGroupEntry, UpdateDate, User_Text, Valid
```

**Workaround:** Parse strength and aggregate size from `ItemName`. Examples:
- `CONCRETO 3500 3/4" AC 1 TGU` → strength=3500 PSI, aggregate=3/4"
- `CONCRETO 5000 3/4 PSI RT 7 D C/IMPERMEABILIZANTE` → strength=5000 PSI
- Pattern: `CONCRETO (\d+)` captures the PSI value from the name

### G4: UDFs on Orders — NOT PRESENT

`U_SF_DeliveryTime`, `U_SF_Instructions` don't exist. Available Order keys:
```
Address, Address2, Cancelled, CardCode, CardName, Comments, DiscountPercent,
DocCurrency, DocDate, DocDueDate, DocEntry, DocNum, DocRate, DocTotal, DocTotalFc,
DocTotalSys, DocType, DocumentLines, DocumentStatus, JournalMemo, NumAtCard,
PaymentGroupCode, PaymentMethod, Printed, RoundingDiffAmount, SalesPersonCode,
TaxDate, TrackingNumber, TransportationCode, UpdateDate, VatSum
```

**Usable alternative:** `Comments` field contains free-text notes (e.g. "Basado en la oportunidad con código ODC-2026-12739..."). Map to `special_instructions`.

### G5: Warehouse → Plant Mapping — RESOLVED

109 warehouses in Duracreto, but only these are concrete production plants (producto terminado):

| Code | Name | City |
|------|------|------|
| `SPSPT` | ALMACEN CONCRETOS SPS PRODUCTO TERMINADO | San Pedro Sula |
| `TGUPT` | ALMACEN TGU PRODUCTO TERMINADO PRIMERA | Tegucigalpa |
| `CORPT` | ALMACEN PTO.CORTES PRODUCTO TERMINADO | Puerto Cortés |
| `CEIPT` | ALMACEN CEIBA PRODUCTO TERMINADO | La Ceiba |
| `CSJPT` | ALMACEN SAN JORGE PRODUCTO TERMINADO (CONCRETO) | San Jorge |
| `CHOPT` | ALMACEN CHOLOMA PRODUCTO TERMINADO | Choloma |
| `SBCPT` | ALMACEN SANTA BARBARA PRODUCTO TERMINADO | Santa Bárbara |
| `STELPT` | ALMACEN SANTA ELENA PRODUCTO TERMINADO | Santa Elena |

**Filter:** Whitelist these 8 warehouse codes as concrete plants.

### G6: Multi-line Orders — DATA SHOWS SPLIT NEEDED

| Lines per Order | Count | % |
|----------------|-------|---|
| 1 | 6,757 | 62% |
| 2 | 3,434 | 32% |
| 3 | 615 | 6% |
| 4+ | 65 | <1% |

38% of orders have multiple lines — too many to ignore. **Recommendation:** Split each SAP DocumentLine into a separate SmartFleet order. Use `DocEntry-LineNum` as `external_id` (e.g. `37702-0`, `37702-1`).

### G7: BPAddresses — PRESENT

`BPAddresses` array is available in the JSONB. Structure per address:
```json
{
  "AddressType": "bo_BillTo" | "bo_ShipTo",
  "AddressName": "SAN PEDRO SULA",
  "Street": "COLONIA LA AMISTAD",
  "City": "San Pedro Sula",
  "State": "05",
  "ZipCode": "",
  "Country": "HN"
}
```

Note: `State` is a numeric code (e.g. "05"), `ZipCode` is often empty.

### G8: EmailAddress, Phone1 — PRESENT

Both fields exist in the mirror. Coverage is sparse — many customers have empty email/phone.

### Additional Findings

**Units of Measure:** All 270 concrete items use **M3** (cubic meters), not CY. SmartFleet's `requested_quantity_unit` default should be `M3` for Duracreto, not `CY`.

**Order DocumentLines keys available:**
```
ItemCode, Quantity, Price, Currency, ShipDate, LineNum, LineTotal,
WarehouseCode, BaseType, BaseLine, DocEntry, TaxCode, UoMCode,
U_AJU, U_DIS, U_REF, U_STF, U_Price (UDFs present on lines!)
```

**SalesPersonCode** is available on Order headers — can be used for salesperson analytics.

### Remaining gaps (require SAP-side changes — write phase)

- Delivery time UDF on Orders — needed for scheduling, create as `U_SF_DeliveryTime` in SAP
- SmartFleet load/ticket UDFs on DeliveryNotes — needed for write-back traceability
- Strength/slump UDFs on Items — nice-to-have but parseable from ItemName

---

## Connection Configuration

```env
# analytics-integration-hub .env addition
SAP_MIRROR_HOST=127.0.0.1
SAP_MIRROR_PORT=5433
SAP_MIRROR_DATABASE=sap_mirror
SAP_MIRROR_USER=platino_ro        # read-only role, RLS enforced
SAP_MIRROR_PASSWORD=<rotated>
SAP_MIRROR_COMPANY_DB=SBO_DURACRETO1  # or configurable
```

The AIH service will use a new Knex connection pool pointing at `sap_mirror` (separate from its own `aih_hub` database) with read-only queries.

---

## Sync Strategy

### Polling approach (recommended for reads)
1. AIH polls `sap_mirror` every 5 minutes (matches mirror refresh cadence)
2. Uses `SyncedAt > last_poll_timestamp` for incremental sync
3. Upserts into SmartFleet tables via `external_id` / `code` matching
4. Emits `ingest_events` for downstream services (DCT, CVP, NTB)

### Data flow
```
.NET SapSyncService → sap_mirror (every 5 min)
                          ↓
                    AIH poller reads
                          ↓
              ┌───────────┴───────────┐
              ↓                       ↓
    OTL Core (customers,        PEOB (plants)
    sites, mix_designs,
    orders)
              ↓
    ingest_events published
              ↓
    DCT, CVP, NTB consume
```
