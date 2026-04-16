/**
 * SAP Mirror Seed Data — Entity Mappings
 *
 * Maps SAP keys to SmartFleet UUIDs so the sync service knows what's
 * already been imported. Without these, a re-sync would create duplicates.
 *
 * Re-seed after OS migration: POST http://localhost:3004/integrations/sap/sync
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Knex } from 'knex';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BATCH = 500;

export async function seed(knex: Knex): Promise<void> {
  const raw = readFileSync(join(__dirname, 'sap-data', 'entity-mappings.json'), 'utf-8');
  const mappings = JSON.parse(raw) as Record<string, unknown>[];

  console.log(`Loading ${mappings.length} SAP entity mappings...`);

  for (let i = 0; i < mappings.length; i += BATCH) {
    const chunk = mappings.slice(i, i + BATCH);
    await knex('sap_entity_mappings').insert(chunk).onConflict('id').merge();
  }

  console.log(`  Done: ${mappings.length} mappings`);
}
