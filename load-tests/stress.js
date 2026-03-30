import http from 'k6/http';
import { check, sleep } from 'k6';
import { makeJwt, BASE_URLS, SEED_IDS, authHeaders } from './helpers.js';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

const token = makeJwt();
const opts = authHeaders(token);

export default function () {
  // Mixed read workload across all services
  const endpoints = [
    `${BASE_URLS.otl}/customers`,
    `${BASE_URLS.otl}/orders/${SEED_IDS.order1}`,
    `${BASE_URLS.otl}/loads/${SEED_IDS.load1}`,
    `${BASE_URLS.dct}/trucks`,
    `${BASE_URLS.dct}/dispatch/board?date=2026-03-29`,
    `${BASE_URLS.dct}/dispatch/exceptions`,
    `${BASE_URLS.aih}/events`,
    `${BASE_URLS.aih}/kpis/snapshots`,
    `${BASE_URLS.peob}/edge/plants`,
    `${BASE_URLS.peob}/edge/batch-events`,
    `${BASE_URLS.peob}/edge/scale-readings`,
    `${BASE_URLS.ntb}/assets`,
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(endpoint, opts);
  check(res, { 'status 2xx': (r) => r.status >= 200 && r.status < 300 });

  sleep(0.05);
}
