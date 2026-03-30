import http from 'k6/http';
import { check, sleep } from 'k6';
import { makeJwt, BASE_URLS, SEED_IDS, authHeaders } from './helpers.js';

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const token = makeJwt();

export default function () {
  // Health checks — all 6 services
  for (const [name, url] of Object.entries(BASE_URLS)) {
    const res = http.get(`${url}/health`);
    check(res, { [`${name} health 200`]: (r) => r.status === 200 });
  }

  // OTL Core
  const opts = authHeaders(token);
  let res = http.get(`${BASE_URLS.otl}/customers`, opts);
  check(res, { 'OTL list customers': (r) => r.status === 200 });

  res = http.get(`${BASE_URLS.otl}/orders/${SEED_IDS.order1}`, opts);
  check(res, { 'OTL get order': (r) => r.status === 200 });

  // Dispatch Tower
  res = http.get(`${BASE_URLS.dct}/trucks`, opts);
  check(res, { 'DCT list trucks': (r) => r.status === 200 });

  res = http.get(`${BASE_URLS.dct}/dispatch/board?date=2026-03-29`, opts);
  check(res, { 'DCT dispatch board': (r) => r.status === 200 });

  // Analytics Hub
  res = http.get(`${BASE_URLS.aih}/events`, opts);
  check(res, { 'AIH list events': (r) => r.status === 200 });

  // Plant Edge
  res = http.get(`${BASE_URLS.peob}/edge/plants`, opts);
  check(res, { 'PEOB list plants': (r) => r.status === 200 });

  sleep(0.5);
}
