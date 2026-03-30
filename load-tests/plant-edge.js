import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { makeJwt, BASE_URLS, SEED_IDS, authHeaders } from './helpers.js';

const batchLatency = new Trend('peob_batch_latency');
const scaleLatency = new Trend('peob_scale_latency');
const writeCount = new Counter('peob_writes');

export const options = {
  stages: [
    { duration: '15s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
    peob_batch_latency: ['p(95)<300'],
    peob_scale_latency: ['p(95)<300'],
  },
};

const token = makeJwt();
const opts = authHeaders(token);

export default function () {
  group('batch events', () => {
    const event = {
      eventId: `k6-batch-${__VU}-${__ITER}-${Date.now()}`,
      plantId: SEED_IDS.plant1,
      mixerId: SEED_IDS.mixer1,
      batchNumber: `K6-${__VU}-${__ITER}`,
      eventType: 'BATCH_STARTED',
      payload: { temperature: 72, humidity: 45 },
      occurredAt: new Date().toISOString(),
    };

    const res = http.post(`${BASE_URLS.peob}/edge/batch-events`, JSON.stringify(event), opts);
    check(res, { 'batch event 201': (r) => r.status === 201 });
    batchLatency.add(res.timings.duration);
    if (res.status === 201) writeCount.add(1);
  });

  group('scale readings', () => {
    const reading = {
      plantId: SEED_IDS.plant1,
      mixerId: SEED_IDS.mixer1,
      batchNumber: `K6-${__VU}-${__ITER}`,
      materialType: 'CEMENT',
      targetWeight: 500,
      actualWeight: 498 + Math.random() * 4,
      unit: 'LB',
      tolerance: 2.0,
      recordedAt: new Date().toISOString(),
    };

    const res = http.post(`${BASE_URLS.peob}/edge/scale-readings`, JSON.stringify(reading), opts);
    check(res, { 'scale reading 201': (r) => r.status === 201 });
    scaleLatency.add(res.timings.duration);
    if (res.status === 201) writeCount.add(1);
  });

  group('queries', () => {
    let res = http.get(`${BASE_URLS.peob}/edge/plants`, opts);
    check(res, { 'list plants 200': (r) => r.status === 200 });

    res = http.get(`${BASE_URLS.peob}/edge/batch-events`, opts);
    check(res, { 'list batches 200': (r) => r.status === 200 });

    res = http.get(`${BASE_URLS.peob}/edge/config`, opts);
    check(res, { 'config 200': (r) => r.status === 200 });
  });

  group('heartbeat', () => {
    const hb = {
      plantId: SEED_IDS.plant1,
      uptimeSeconds: 86400 + __ITER,
      cpuPercent: 30 + Math.random() * 40,
      memoryPercent: 50 + Math.random() * 20,
      diskPercent: 35 + Math.random() * 10,
      pendingOutbound: Math.floor(Math.random() * 5),
    };

    const res = http.post(`${BASE_URLS.peob}/edge/heartbeat`, JSON.stringify(hb), opts);
    check(res, { 'heartbeat 201': (r) => r.status === 201 });
  });

  sleep(0.2);
}
