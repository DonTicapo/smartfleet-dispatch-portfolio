/**
 * SAP-Derived Seed Data — Customer Visibility Portal
 *
 * Creates portal users for top SAP customers and populates order_views
 * from OTL Core's SAP-synced orders. This allows the CVP frontend to
 * display real SAP orders without a live OTL Core connection.
 *
 * Re-seed after OS migration: re-run SAP sync on AIH, then regenerate
 * these seeds from the OTL Core database.
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

function toRow(r: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(r)) {
    out[k] = typeof v === 'object' && v !== null && !Array.isArray(v) ? JSON.stringify(v) : v;
  }
  return out;
}

export async function seed(knex: Knex): Promise<void> {
  const users = loadJson('portal-users.json') as Record<string, unknown>[];
  const orders = (loadJson('order-views.json') as Record<string, unknown>[]).map(toRow);

  console.log(`Loading CVP SAP seed data...`);
  console.log(`  Portal users: ${users.length}`);
  console.log(`  Order views:  ${orders.length}`);

  // Portal users
  for (const user of users) {
    await knex('portal_users').insert(user).onConflict('email').merge();
  }

  // Order views in batches
  for (let i = 0; i < orders.length; i += BATCH) {
    const chunk = orders.slice(i, i + BATCH);
    await knex('order_views').insert(chunk).onConflict('external_order_id').merge();
  }

  console.log(`  Done: ${users.length} users, ${orders.length} order views`);
}
