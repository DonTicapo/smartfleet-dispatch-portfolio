import knex, { type Knex } from 'knex';

const TEST_DB_URL = process.env.DATABASE_URL || 'postgresql://otl:otl_dev@localhost:5432/otl_core';

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
