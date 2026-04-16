/**
 * SAP Mirror Seed Data — Duracreto (SBO_DURACRETO1)
 *
 * This seed loads real SAP B1 data synced from the Platino Intelligence sap_mirror
 * database on 2026-04-16. It allows SmartFleet to run standalone without a live
 * SAP mirror connection.
 *
 * IMPORTANT: If this seed fails (e.g. after an OS migration or server split),
 * you need to re-run the SAP sync to regenerate the data:
 *
 *   1. Ensure sap_mirror is accessible (PG 5433)
 *   2. Start OTL Core, PEOB, and AIH services
 *   3. POST http://localhost:3004/integrations/sap/sync
 *      -H "Authorization: Bearer sap-sync-service"
 *   4. Re-export the data with: scripts/export-sap-seeds.sh (TODO)
 *
 * The sap_mirror is maintained by the Platino Intelligence .NET SapSyncService
 * and refreshes every 5-15 minutes from SAP B1 Service Layer.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Knex } from 'knex';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BATCH = 500;

function loadJson(filename: string): unknown[] {
  const raw = readFileSync(join(__dirname, 'sap-data', filename), 'utf-8');
  return JSON.parse(raw);
}

function toSnake(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      out[k] = typeof v === 'object' && v !== null && !Array.isArray(v) ? JSON.stringify(v) : v;
    }
    return out;
  });
}

async function batchInsert(knex: Knex, table: string, rows: Record<string, unknown>[]): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await knex(table).insert(chunk).onConflict('id').merge();
    inserted += chunk.length;
  }
  return inserted;
}

export async function seed(knex: Knex): Promise<void> {
  console.log('Loading SAP seed data (SBO_DURACRETO1)...');

  const customers = toSnake(loadJson('customers.json') as Record<string, unknown>[]);
  const sites = toSnake(loadJson('sites.json') as Record<string, unknown>[]);
  const mixDesigns = toSnake(loadJson('mix-designs.json') as Record<string, unknown>[]);
  const jobs = toSnake(loadJson('jobs.json') as Record<string, unknown>[]);
  const orders = toSnake(loadJson('orders.json') as Record<string, unknown>[]);

  console.log(`  Customers:   ${customers.length}`);
  console.log(`  Sites:       ${sites.length}`);
  console.log(`  Mix designs: ${mixDesigns.length}`);
  console.log(`  Jobs:        ${jobs.length}`);
  console.log(`  Orders:      ${orders.length}`);

  // Insert in dependency order
  const c = await batchInsert(knex, 'customers', customers);
  const m = await batchInsert(knex, 'mix_designs', mixDesigns);
  const s = await batchInsert(knex, 'sites', sites);
  const j = await batchInsert(knex, 'jobs', jobs);
  const o = await batchInsert(knex, 'orders', orders);

  console.log(`  Done: ${c} customers, ${s} sites, ${m} mix_designs, ${j} jobs, ${o} orders`);
}
