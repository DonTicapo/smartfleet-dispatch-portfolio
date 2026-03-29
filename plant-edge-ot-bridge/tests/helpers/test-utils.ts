import knex, { type Knex } from 'knex';
import { randomUUID } from 'crypto';

const TEST_DB_URL = process.env.DATABASE_URL || 'postgresql://peob:peob_dev@localhost:5432/peob_bridge';

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

export function makePlant(overrides: Record<string, unknown> = {}) {
  return {
    code: `PLT-${randomUUID().slice(0, 6)}`,
    name: 'Test Plant',
    location: JSON.stringify({ lat: 32.78, lon: -96.8, address: '100 Concrete Way' }),
    timezone: 'America/Chicago',
    is_active: true,
    ...overrides,
  };
}

export function makeMixer(plantId: string, overrides: Record<string, unknown> = {}) {
  return {
    plant_id: plantId,
    code: `MXR-${randomUUID().slice(0, 6)}`,
    name: 'Test Mixer',
    type: 'DRUM',
    capacity_cy: 10.0,
    status: 'IDLE',
    last_status_at: new Date(),
    ...overrides,
  };
}

export function makeBatchEvent(plantId: string, mixerId: string, overrides: Record<string, unknown> = {}) {
  return {
    event_id: `evt-${randomUUID().slice(0, 8)}`,
    plant_id: plantId,
    mixer_id: mixerId,
    batch_number: `B-${randomUUID().slice(0, 6)}`,
    event_type: 'BATCH_STARTED',
    payload: JSON.stringify({}),
    occurred_at: new Date(),
    ...overrides,
  };
}

export function makeScaleReading(plantId: string, mixerId: string, overrides: Record<string, unknown> = {}) {
  return {
    plant_id: plantId,
    mixer_id: mixerId,
    material_type: 'CEMENT',
    target_weight: 1000.0,
    actual_weight: 998.0,
    unit: 'LB',
    tolerance: 2.0,
    within_tolerance: true,
    recorded_at: new Date(),
    ...overrides,
  };
}
