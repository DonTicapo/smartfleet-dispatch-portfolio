import knex, { type Knex } from 'knex';

let _db: Knex | null = null;
let _sapMirrorDb: Knex | null = null;

export function getDb(connectionString?: string): Knex {
  if (!_db) {
    _db = knex({
      client: 'pg',
      connection: connectionString || process.env.DATABASE_URL || 'postgresql://aih:aih_dev@localhost:5432/aih_hub',
      pool: { min: 2, max: 10 },
    });
  }
  return _db;
}

export function getSapMirrorDb(connectionString?: string): Knex {
  if (!_sapMirrorDb) {
    _sapMirrorDb = knex({
      client: 'pg',
      connection: connectionString || process.env.SAP_MIRROR_URL || 'postgresql://pi_l2_ro:changeme@localhost:5433/sap_mirror',
      pool: { min: 1, max: 5 },
    });
  }
  return _sapMirrorDb;
}

export async function closeDb(): Promise<void> {
  if (_db) {
    await _db.destroy();
    _db = null;
  }
  if (_sapMirrorDb) {
    await _sapMirrorDb.destroy();
    _sapMirrorDb = null;
  }
}
