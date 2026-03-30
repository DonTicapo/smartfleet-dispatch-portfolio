import http from 'k6/http';
import { check, sleep } from 'k6';
import { makeJwt, BASE_URLS, SEED_IDS, authHeaders } from './helpers.js';

export const options = {
  stages: [
    { duration: '15s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '15s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    http_reqs: ['rate>50'],
  },
};

const token = makeJwt();
const opts = authHeaders(token);

export default function () {
  const scenario = Math.random();

  if (scenario < 0.25) {
    // OTL Core — order flow
    http.get(`${BASE_URLS.otl}/customers`, opts);
    http.get(`${BASE_URLS.otl}/customers/${SEED_IDS.customer1}`, opts);
    http.get(`${BASE_URLS.otl}/orders/${SEED_IDS.order1}`, opts);
    http.get(`${BASE_URLS.otl}/tickets/${SEED_IDS.ticket1}`, opts);
    http.get(`${BASE_URLS.otl}/loads/${SEED_IDS.load1}`, opts);
  } else if (scenario < 0.5) {
    // Dispatch Tower — board operations
    http.get(`${BASE_URLS.dct}/trucks`, opts);
    http.get(`${BASE_URLS.dct}/drivers`, opts);
    http.get(`${BASE_URLS.dct}/dispatch/board?date=2026-03-29`, opts);
    http.get(`${BASE_URLS.dct}/dispatch/exceptions`, opts);
  } else if (scenario < 0.75) {
    // Analytics Hub — event queries
    http.get(`${BASE_URLS.aih}/events`, opts);
    http.get(`${BASE_URLS.aih}/kpis/definitions`, opts);
    http.get(`${BASE_URLS.aih}/kpis/snapshots`, opts);
    http.get(`${BASE_URLS.aih}/integrations/webhooks`, opts);
  } else {
    // Plant Edge — telemetry
    http.get(`${BASE_URLS.peob}/edge/plants`, opts);
    http.get(`${BASE_URLS.peob}/edge/batch-events`, opts);
    http.get(`${BASE_URLS.peob}/edge/scale-readings`, opts);
    http.get(`${BASE_URLS.peob}/edge/config`, opts);
  }

  sleep(0.1);
}
