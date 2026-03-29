import knex, { type Knex } from 'knex';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const TEST_DB_URL = process.env.DATABASE_URL || 'postgresql://aih:aih_dev@localhost:5432/aih_hub';

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

export function makeTestToken(sub: string = 'test-user', role: string = 'admin'): string {
  return jwt.sign({ sub, role }, 'change-me-in-production');
}

export function makeIngestEvent(overrides: Record<string, unknown> = {}) {
  return {
    event_id: `evt-${randomUUID().slice(0, 12)}`,
    source: 'OTL_CORE',
    event_type: 'load.completed',
    aggregate_type: 'Load',
    aggregate_id: randomUUID(),
    payload: JSON.stringify({
      loadId: randomUUID(),
      plantId: 'plant-001',
      quantity: 10.5,
      customerId: 'cust-001',
      truckId: 'truck-001',
    }),
    occurred_at: new Date(),
    ...overrides,
  };
}

export function makeKpiDefinition(overrides: Record<string, unknown> = {}) {
  return {
    name: `kpi_${randomUUID().slice(0, 8)}`,
    display_name: 'Test KPI',
    description: 'A test KPI definition',
    unit: 'count',
    dimension: 'PLANT',
    formula: 'count(events)',
    is_active: true,
    ...overrides,
  };
}

export function makeWebhookSubscription(overrides: Record<string, unknown> = {}) {
  return {
    url: 'https://example.com/webhook',
    event_types: ['load.completed', 'delivery.plant_departed'],
    secret: 'a-secret-that-is-long-enough-for-validation',
    is_active: true,
    failure_count: 0,
    ...overrides,
  };
}
