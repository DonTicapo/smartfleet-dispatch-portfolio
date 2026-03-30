import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { makeJwt, BASE_URLS, SEED_IDS, authHeaders } from './helpers.js';

const ingestLatency = new Trend('aih_ingest_latency');
const ingestCount = new Counter('aih_ingested_events');

export const options = {
  stages: [
    { duration: '15s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
    aih_ingest_latency: ['p(95)<300'],
  },
};

const token = makeJwt();
const opts = authHeaders(token);

export default function () {
  group('event ingestion', () => {
    const event = {
      eventId: `k6-${__VU}-${__ITER}-${Date.now()}`,
      source: 'OTL_CORE',
      eventType: 'LOAD_STATUS_CHANGED',
      aggregateType: 'Load',
      aggregateId: SEED_IDS.load1,
      payload: {
        previousStatus: 'EN_ROUTE',
        newStatus: 'ON_SITE',
        timestamp: new Date().toISOString(),
      },
      occurredAt: new Date().toISOString(),
    };

    const res = http.post(`${BASE_URLS.aih}/events`, JSON.stringify(event), opts);
    check(res, { 'ingest 201': (r) => r.status === 201 });
    ingestLatency.add(res.timings.duration);
    if (res.status === 201) ingestCount.add(1);
  });

  group('queries', () => {
    let res = http.get(`${BASE_URLS.aih}/events`, opts);
    check(res, { 'list events 200': (r) => r.status === 200 });

    res = http.get(`${BASE_URLS.aih}/kpis/definitions`, opts);
    check(res, { 'kpi definitions 200': (r) => r.status === 200 });

    res = http.get(`${BASE_URLS.aih}/kpis/snapshots`, opts);
    check(res, { 'kpi snapshots 200': (r) => r.status === 200 });

    res = http.get(`${BASE_URLS.aih}/integrations/webhooks`, opts);
    check(res, { 'webhooks 200': (r) => r.status === 200 });
  });

  sleep(0.2);
}
