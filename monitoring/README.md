# Monitoring Stack

Prometheus + Grafana monitoring for all 6 SmartFleet microservices.

## Quick Start

```bash
cd monitoring
docker compose up -d
```

- **Grafana**: http://localhost:3100 (admin / smartfleet)
- **Prometheus**: http://localhost:9090

## What's Included

### Prometheus
- Scrapes all 6 services every 15s on their `/metrics` endpoint
- 7-day retention
- Service labels for filtering

### Grafana
- Pre-provisioned Prometheus datasource
- **SmartFleet Overview** dashboard with:
  - Request rate by service (req/s)
  - p95 latency by service (with green/yellow/red thresholds)
  - Error rate percentage by service
  - Service health status (UP/DOWN)
  - Request duration heatmap

## Adding Metrics to Services

Install `fastify-metrics` in each service to expose Prometheus-compatible metrics:

```bash
npm install fastify-metrics
```

```typescript
import metricsPlugin from 'fastify-metrics';

await app.register(metricsPlugin, {
  defaultMetrics: { enabled: true },
  routeMetrics: { enabled: true },
  endpoint: '/metrics',
});
```

This exposes standard HTTP request duration histograms, Node.js runtime metrics, and process metrics at `/metrics`.

## Architecture

```
Services (:3000-:3005)  →  Prometheus (:9090)  →  Grafana (:3100)
         /metrics              scrape               dashboards
```
