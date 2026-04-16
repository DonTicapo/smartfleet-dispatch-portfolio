/**
 * SAP Mirror Seed Data — Duracreto Plants
 *
 * 8 concrete production plants from SAP Warehouses (SBO_DURACRETO1).
 * See order-ticket-load-core/seeds/002_sap_data.ts for full context.
 *
 * Re-seed after OS migration: POST http://localhost:3004/integrations/sap/sync
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Knex } from 'knex';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function seed(knex: Knex): Promise<void> {
  const raw = readFileSync(join(__dirname, 'sap-data', 'plants.json'), 'utf-8');
  const plants = (JSON.parse(raw) as Record<string, unknown>[]).map((r) => ({
    ...r,
    location: r.location ? JSON.stringify(r.location) : null,
  }));

  console.log(`Loading ${plants.length} SAP plants...`);

  for (const plant of plants) {
    await knex('plants').insert(plant).onConflict('id').merge();
  }

  console.log(`  Done: ${plants.length} plants`);
}
