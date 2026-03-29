import knex, { type Knex } from 'knex';
import jwt from 'jsonwebtoken';
import { scryptSync, randomBytes } from 'crypto';

const TEST_DB_URL = process.env.DATABASE_URL || 'postgresql://cvp:cvp_dev@localhost:5432/cvp_portal';

let _db: Knex | null = null;
let _schema: string | null = null;

export async function setupTestDb(): Promise<Knex> {
  _schema = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  _db = knex({
    client: 'pg',
    connection: TEST_DB_URL,
    searchPath: [_schema, 'public'],
  });

  await _db.raw(`CREATE SCHEMA IF NOT EXISTS "${_schema}"`);
  await _db.raw(`SET search_path TO "${_schema}", public`);

  // Run migrations against the test schema
  await _db.migrate.latest({
    directory: './src/infrastructure/database/migrations',
    schemaName: _schema,
  });

  return _db;
}

export async function teardownTestDb(): Promise<void> {
  if (_db && _schema) {
    await _db.raw(`DROP SCHEMA IF EXISTS "${_schema}" CASCADE`);
    await _db.destroy();
    _db = null;
    _schema = null;
  }
}

export function getTestDb(): Knex {
  if (!_db) throw new Error('Test DB not initialized. Call setupTestDb() first.');
  return _db;
}

const SCRYPT_KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

export function generateTestToken(
  payload: { sub: string; role: string; customerId: string },
  secret: string = 'change-me-in-production',
): string {
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

export function makePortalUser(customerId: string, overrides: Record<string, unknown> = {}) {
  return {
    customer_id: customerId,
    email: `user-${randomBytes(4).toString('hex')}@example.com`,
    name: 'Test User',
    role: 'VIEWER',
    password_hash: hashPassword('testpassword123'),
    is_active: true,
    ...overrides,
  };
}

export function makeOrderView(customerId: string, overrides: Record<string, unknown> = {}) {
  return {
    external_order_id: randomBytes(8).toString('hex'),
    customer_id: customerId,
    job_name: 'Test Job',
    site_name: 'Test Site',
    mix_design_name: 'Test Mix 3000',
    requested_quantity_amount: 50.0,
    requested_quantity_unit: 'CY',
    requested_delivery_date: '2026-04-01',
    status: 'DRAFT',
    last_synced_at: new Date(),
    ...overrides,
  };
}

export function makeTicketView(orderId: string, overrides: Record<string, unknown> = {}) {
  return {
    external_ticket_id: randomBytes(8).toString('hex'),
    order_id: orderId,
    ticket_number: `TKT-${randomBytes(4).toString('hex')}`,
    status: 'CREATED',
    scheduled_date: '2026-04-01',
    last_synced_at: new Date(),
    ...overrides,
  };
}

export function makeLoadTracker(ticketId: string, overrides: Record<string, unknown> = {}) {
  return {
    external_load_id: randomBytes(8).toString('hex'),
    ticket_id: ticketId,
    load_number: 1,
    status: 'SCHEDULED',
    last_synced_at: new Date(),
    ...overrides,
  };
}

export function makePortalMessage(customerId: string, overrides: Record<string, unknown> = {}) {
  return {
    customer_id: customerId,
    subject: 'Test Message',
    body: 'This is a test message.',
    severity: 'INFO',
    is_read: false,
    created_by: 'system',
    ...overrides,
  };
}
