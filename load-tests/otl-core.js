import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { makeJwt, BASE_URLS, SEED_IDS, authHeaders } from './helpers.js';

const orderLatency = new Trend('otl_order_latency');
const loadLatency = new Trend('otl_load_latency');
const createCounter = new Counter('otl_creates');

export const options = {
  stages: [
    { duration: '15s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    otl_order_latency: ['p(95)<300'],
    otl_load_latency: ['p(95)<300'],
  },
};

const token = makeJwt();
const opts = authHeaders(token);

export default function () {
  group('read operations', () => {
    let res = http.get(`${BASE_URLS.otl}/customers`, opts);
    check(res, { 'list customers 200': (r) => r.status === 200 });

    res = http.get(`${BASE_URLS.otl}/customers/${SEED_IDS.customer1}`, opts);
    check(res, { 'get customer 200': (r) => r.status === 200 });

    res = http.get(`${BASE_URLS.otl}/sites?customerId=${SEED_IDS.customer1}`, opts);
    check(res, { 'list sites 200': (r) => r.status === 200 });

    res = http.get(`${BASE_URLS.otl}/orders/${SEED_IDS.order1}`, opts);
    check(res, { 'get order 200': (r) => r.status === 200 });
    orderLatency.add(res.timings.duration);

    res = http.get(`${BASE_URLS.otl}/tickets/${SEED_IDS.ticket1}`, opts);
    check(res, { 'get ticket 200': (r) => r.status === 200 });

    res = http.get(`${BASE_URLS.otl}/loads/${SEED_IDS.load1}`, opts);
    check(res, { 'get load 200': (r) => r.status === 200 });
    loadLatency.add(res.timings.duration);
  });

  group('write operations', () => {
    const order = {
      customerId: SEED_IDS.customer1,
      jobId: SEED_IDS.job1,
      mixDesignId: SEED_IDS.mixDesign1,
      requestedQuantity: { amount: 10, unit: 'CY' },
      requestedDeliveryDate: '2026-04-15',
      requestedDeliveryTime: '08:00',
      specialInstructions: `k6 load test ${Date.now()}`,
    };

    const res = http.post(`${BASE_URLS.otl}/orders`, JSON.stringify(order), opts);
    check(res, { 'create order 201': (r) => r.status === 201 });
    if (res.status === 201) createCounter.add(1);
  });

  sleep(0.2);
}
