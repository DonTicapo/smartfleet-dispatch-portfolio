# Load Tests

Performance tests using [k6](https://k6.io/) for the SmartFleet Dispatch Portfolio.

## Prerequisites

```bash
# Install k6
# macOS
brew install k6

# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Docker
docker run --rm -i grafana/k6 run - <script.js
```

## Running

Make sure services are running and seeded with demo data first.

```bash
# Smoke test (1 VU, 10s)
k6 run load-tests/smoke.js

# Load test (50 VUs, 2 minutes)
k6 run load-tests/load.js

# Stress test (ramp to 200 VUs)
k6 run load-tests/stress.js

# Single service test
k6 run load-tests/otl-core.js
k6 run load-tests/dispatch-tower.js
k6 run load-tests/analytics-hub.js
k6 run load-tests/plant-edge.js
```

## Thresholds

All scripts include pass/fail thresholds:
- **p95 < 500ms** — 95th percentile response time
- **Error rate < 1%** — failed requests
- **Request rate > 50/s** — minimum throughput per service
