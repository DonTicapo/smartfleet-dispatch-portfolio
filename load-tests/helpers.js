import crypto from 'k6/crypto';
import encoding from 'k6/encoding';

const JWT_SECRET = 'change-me-in-production';

export function makeJwt(sub, role, customerId) {
  const header = encoding.b64encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }), 'rawurl');
  const payload = encoding.b64encode(
    JSON.stringify({
      sub: sub || 'k6-load-test',
      role: role || 'admin',
      customerId: customerId || '',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
    'rawurl',
  );
  const signature = encoding.b64encode(
    crypto.hmac('sha256', JWT_SECRET, `${header}.${payload}`, 'binary'),
    'rawurl',
  );
  return `${header}.${payload}.${signature}`;
}

export const SEED_IDS = {
  customer1: '11111111-1111-1111-1111-111111111001',
  customer2: '11111111-1111-1111-1111-111111111002',
  site1: '11111111-1111-1111-1111-111111112001',
  job1: '11111111-1111-1111-1111-111111112501',
  mixDesign1: '11111111-1111-1111-1111-111111119001',
  order1: '11111111-1111-1111-1111-111111113001',
  ticket1: '11111111-1111-1111-1111-111111114001',
  load1: '11111111-1111-1111-1111-111111115001',
  plant1: '11111111-1111-1111-1111-111111120001',
  mixer1: '11111111-1111-1111-1111-111111121001',
};

export const BASE_URLS = {
  otl: 'http://localhost:3000',
  ntb: 'http://localhost:3001',
  dct: 'http://localhost:3002',
  cvp: 'http://localhost:3003',
  aih: 'http://localhost:3004',
  peob: 'http://localhost:3005',
};

export function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}
