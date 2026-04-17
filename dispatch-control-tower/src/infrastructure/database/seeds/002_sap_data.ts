/**
 * SAP-Derived Seed Data — Dispatch Control Tower
 *
 * Populates trucks (3 per SAP plant), drivers, and dispatch board entries
 * from OTL Core's SAP-synced orders. This gives the DCT frontend real
 * SAP data to display.
 *
 * Re-seed after OS migration: re-run SAP sync on AIH, then regenerate.
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

export async function seed(knex: Knex): Promise<void> {
  const trucks = loadJson('trucks.json') as Record<string, unknown>[];
  const drivers = loadJson('drivers.json') as Record<string, unknown>[];
  const board = loadJson('dispatch-board.json') as Record<string, unknown>[];

  console.log(`Loading DCT SAP seed data...`);
  console.log(`  Trucks:  ${trucks.length}`);
  console.log(`  Drivers: ${drivers.length}`);
  console.log(`  Board:   ${board.length}`);

  // Trucks
  for (const truck of trucks) {
    await knex('trucks').insert(truck).onConflict('number').merge();
  }

  // Drivers
  for (const driver of drivers) {
    await knex('drivers').insert(driver).onConflict('id').merge();
  }

  // Dispatch board
  for (let i = 0; i < board.length; i += BATCH) {
    const chunk = board.slice(i, i + BATCH);
    await knex('dispatch_board').insert(chunk).onConflict(['date', 'load_id']).merge();
  }

  console.log(`  Done: ${trucks.length} trucks, ${drivers.length} drivers, ${board.length} board entries`);
}
