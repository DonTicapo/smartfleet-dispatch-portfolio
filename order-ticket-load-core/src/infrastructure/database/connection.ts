import knex, { type Knex } from 'knex';

let _db: Knex | null = null;

export function getDb(connectionString?: string): Knex {
  if (!_db) {
    _db = knex({
      client: 'pg',
      connection: connectionString || process.env.DATABASE_URL || 'postgresql://otl:otl_dev@localhost:5432/otl_core',
      pool: { min: 2, max: 10 },
    });
  }
  return _db;
}

export async function closeDb(): Promise<void> {
  if (_db) {
    await _db.destroy();
    _db = null;
  }
}
