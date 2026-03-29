#!/usr/bin/env bash
set -euo pipefail

# SmartFleet Dispatch Portfolio — End-to-End Demo
# Starts all services, runs migrations, seeds data, and exercises every API.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
JWT_SECRET="change-me-in-production"
SERVICES=(
  "order-ticket-load-core:3000"
  "navixy-telematics-bridge:3001"
  "dispatch-control-tower:3002"
  "customer-visibility-portal:3003"
  "analytics-integration-hub:3004"
  "plant-edge-ot-bridge:3005"
)

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

PIDS=()
PASS=0
FAIL=0

cleanup() {
  echo -e "\n${YELLOW}Shutting down services...${NC}"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  echo -e "${GREEN}Done.${NC}"
}
trap cleanup EXIT

log()  { echo -e "${BLUE}[demo]${NC} $*"; }
pass() { echo -e "  ${GREEN}✓${NC} $*"; PASS=$((PASS + 1)); }
fail() { echo -e "  ${RED}✗${NC} $*"; FAIL=$((FAIL + 1)); }

# Generate a JWT token for API calls
make_jwt() {
  local sub="${1:-demo-user}"
  local role="${2:-admin}"
  local customer_id="${3:-}"
  local header payload signature
  header=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 -w0 | tr '+/' '-_' | tr -d '=')
  if [ -n "$customer_id" ]; then
    payload=$(echo -n "{\"sub\":\"${sub}\",\"role\":\"${role}\",\"customerId\":\"${customer_id}\",\"iat\":$(date +%s),\"exp\":$(($(date +%s) + 3600))}" | base64 -w0 | tr '+/' '-_' | tr -d '=')
  else
    payload=$(echo -n "{\"sub\":\"${sub}\",\"role\":\"${role}\",\"iat\":$(date +%s),\"exp\":$(($(date +%s) + 3600))}" | base64 -w0 | tr '+/' '-_' | tr -d '=')
  fi
  signature=$(echo -n "${header}.${payload}" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 -w0 | tr '+/' '-_' | tr -d '=')
  echo "${header}.${payload}.${signature}"
}

# HTTP helper: method, url, expected_status, description, [body]
api() {
  local method="$1" url="$2" expected="$3" desc="$4" body="${5:-}"
  local status
  if [ -n "$body" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$body" 2>/dev/null) || status="000"
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null) || status="000"
  fi
  if [ "$status" = "$expected" ]; then
    pass "$desc (HTTP $status)"
  else
    fail "$desc (expected $expected, got $status)"
  fi
}

api_public() {
  local method="$1" url="$2" expected="$3" desc="$4" body="${5:-}"
  local status
  if [ -n "$body" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" \
      -d "$body" 2>/dev/null) || status="000"
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" 2>/dev/null) || status="000"
  fi
  if [ "$status" = "$expected" ]; then
    pass "$desc (HTTP $status)"
  else
    fail "$desc (expected $expected, got $status)"
  fi
}

echo -e "${BOLD}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   SmartFleet Dispatch Portfolio — E2E Demo       ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ─── Step 1: Start services ──────────────────────────────────────────
log "Starting all 6 services..."
for entry in "${SERVICES[@]}"; do
  name="${entry%%:*}"
  port="${entry##*:}"
  cd "$ROOT_DIR/$name"
  LOG_LEVEL=error PORT="$port" npx tsx src/index.ts &
  PIDS+=($!)
  echo -e "  ${GREEN}●${NC} $name → :$port (PID ${PIDS[-1]})"
done

# ─── Step 2: Wait for health checks ──────────────────────────────────
log "Waiting for services to be healthy..."
for entry in "${SERVICES[@]}"; do
  name="${entry%%:*}"
  port="${entry##*:}"
  for i in $(seq 1 30); do
    if curl -sf "http://localhost:$port/health" >/dev/null 2>&1; then
      echo -e "  ${GREEN}✓${NC} $name healthy"
      break
    fi
    if [ "$i" = "30" ]; then
      echo -e "  ${RED}✗${NC} $name failed to start"
      exit 1
    fi
    sleep 1
  done
done

# ─── Step 3: Run migrations ──────────────────────────────────────────
log "Running migrations..."
for entry in "${SERVICES[@]}"; do
  name="${entry%%:*}"
  cd "$ROOT_DIR/$name"
  npx knex migrate:latest --knexfile knexfile.ts 2>/dev/null && \
    echo -e "  ${GREEN}✓${NC} $name migrated" || \
    echo -e "  ${YELLOW}⚠${NC} $name migration skipped (may already be current)"
done

# ─── Step 4: Seed demo data ──────────────────────────────────────────
log "Seeding demo data..."
for entry in "${SERVICES[@]}"; do
  name="${entry%%:*}"
  cd "$ROOT_DIR/$name"
  npx knex seed:run --knexfile knexfile.ts 2>/dev/null && \
    echo -e "  ${GREEN}✓${NC} $name seeded" || \
    echo -e "  ${YELLOW}⚠${NC} $name seed skipped"
done

# ─── Step 5: Exercise APIs ───────────────────────────────────────────
TOKEN=$(make_jwt "demo-user" "admin")
CUSTOMER_TOKEN=$(make_jwt "demo@acme-construction.com" "VIEWER" "11111111-1111-1111-1111-111111111001")

echo ""
log "${BOLD}Testing Order Ticket Load Core (:3000)${NC}"
api_public GET "http://localhost:3000/health" "200" "Health check"
api GET "http://localhost:3000/customers" "200" "List customers"
api GET "http://localhost:3000/customers/11111111-1111-1111-1111-111111111001" "200" "Get customer by ID"
api GET "http://localhost:3000/sites?customerId=11111111-1111-1111-1111-111111111001" "200" "List sites for customer"
api GET "http://localhost:3000/orders/11111111-1111-1111-1111-111111113001" "200" "Get order by ID"
api GET "http://localhost:3000/tickets/11111111-1111-1111-1111-111111114001" "200" "Get ticket by ID"
api GET "http://localhost:3000/loads/11111111-1111-1111-1111-111111115001" "200" "Get load by ID"

echo ""
log "${BOLD}Testing Navixy Telematics Bridge (:3001)${NC}"
api_public GET "http://localhost:3001/health" "200" "Health check"
api GET "http://localhost:3001/assets" "200" "List tracker assets"
api GET "http://localhost:3001/trips" "200" "List trips"
api GET "http://localhost:3001/geofence-zones" "200" "List geofence zones"
api GET "http://localhost:3001/geofence-events" "200" "List geofence events"

echo ""
log "${BOLD}Testing Dispatch Control Tower (:3002)${NC}"
api_public GET "http://localhost:3002/health" "200" "Health check"
api GET "http://localhost:3002/trucks" "200" "List trucks"
api GET "http://localhost:3002/drivers" "200" "List drivers"
api GET "http://localhost:3002/assignments" "200" "List assignments"
api GET "http://localhost:3002/exceptions" "200" "List exceptions"

echo ""
log "${BOLD}Testing Customer Visibility Portal (:3003)${NC}"
api_public GET "http://localhost:3003/health" "200" "Health check"
TOKEN_BAK="$TOKEN"
TOKEN="$CUSTOMER_TOKEN"
api GET "http://localhost:3003/portal/orders" "200" "List orders (customer-scoped)"
api GET "http://localhost:3003/portal/messages" "200" "List messages"
TOKEN="$TOKEN_BAK"

echo ""
log "${BOLD}Testing Analytics Integration Hub (:3004)${NC}"
api_public GET "http://localhost:3004/health" "200" "Health check"
api GET "http://localhost:3004/events" "200" "List ingested events"
api GET "http://localhost:3004/kpis/definitions" "200" "List KPI definitions"
api GET "http://localhost:3004/kpis/snapshots" "200" "List KPI snapshots"
api GET "http://localhost:3004/integrations/webhooks" "200" "List webhooks"
api POST "http://localhost:3004/events" "201" "Ingest new event" \
  '{"eventId":"demo-evt-001","source":"OTL_CORE","eventType":"LOAD_COMPLETED","aggregateType":"Load","aggregateId":"11111111-1111-1111-1111-111111115001","payload":{"status":"COMPLETED"},"occurredAt":"2026-03-29T10:00:00Z"}'

echo ""
log "${BOLD}Testing Plant Edge OT Bridge (:3005)${NC}"
api_public GET "http://localhost:3005/health" "200" "Health check"
api GET "http://localhost:3005/edge/plants" "200" "List plants"
api GET "http://localhost:3005/edge/plants/11111111-1111-1111-1111-111111120001/mixers" "200" "List mixers for plant"
api GET "http://localhost:3005/edge/batch-events" "200" "List batch events"
api GET "http://localhost:3005/edge/scale-readings" "200" "List scale readings"
api GET "http://localhost:3005/edge/config" "200" "Get edge config"
api POST "http://localhost:3005/edge/heartbeat" "201" "Record heartbeat" \
  '{"plantId":"11111111-1111-1111-1111-111111120001","uptimeSeconds":86400,"cpuPercent":45.2,"memoryPercent":62.1,"diskPercent":38.5,"pendingOutbound":0}'

# ─── Results ──────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC} out of $((PASS + FAIL)) tests"
echo -e "${BOLD}══════════════════════════════════════════════════${NC}"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
