import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { makeJwt, BASE_URLS, authHeaders } from './helpers.js';

const boardLatency = new Trend('dct_board_latency');

export const options = {
  stages: [
    { duration: '15s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    dct_board_latency: ['p(95)<400'],
  },
};

const token = makeJwt();
const opts = authHeaders(token);

export default function () {
  group('fleet management', () => {
    let res = http.get(`${BASE_URLS.dct}/trucks`, opts);
    check(res, { 'list trucks 200': (r) => r.status === 200 });

    res = http.get(`${BASE_URLS.dct}/drivers`, opts);
    check(res, { 'list drivers 200': (r) => r.status === 200 });
  });

  group('dispatch board', () => {
    const res = http.get(`${BASE_URLS.dct}/dispatch/board?date=2026-03-29`, opts);
    check(res, { 'board 200': (r) => r.status === 200 });
    boardLatency.add(res.timings.duration);
  });

  group('exceptions', () => {
    let res = http.get(`${BASE_URLS.dct}/dispatch/exceptions`, opts);
    check(res, { 'list exceptions 200': (r) => r.status === 200 });

    res = http.get(`${BASE_URLS.dct}/dispatch/exceptions?status=OPEN`, opts);
    check(res, { 'open exceptions 200': (r) => r.status === 200 });
  });

  sleep(0.2);
}
