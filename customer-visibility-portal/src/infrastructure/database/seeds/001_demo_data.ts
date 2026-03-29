import type { Knex } from 'knex';
import crypto from 'node:crypto';

function hashPassword(password: string): string {
  const salt = Buffer.from('smartfleet-demo-salt-2026', 'utf8');
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data in reverse dependency order
  await knex('audit_log').del();
  await knex('portal_messages').del();
  await knex('load_trackers').del();
  await knex('ticket_views').del();
  await knex('order_views').del();
  await knex('portal_users').del();

  const passwordHash = hashPassword('demo123');

  // --- Portal Users (1 per customer) ---
  await knex('portal_users').insert([
    {
      id: '44444444-4444-4444-4444-444444441001',
      customer_id: '11111111-1111-1111-1111-111111111001',
      email: 'demo@acme-construction.com',
      name: 'Acme Demo User',
      role: 'ADMIN',
      password_hash: passwordHash,
      last_login_at: '2026-03-28T07:00:00Z',
      is_active: true,
      created_at: '2026-01-20T10:00:00Z',
      updated_at: '2026-03-28T07:00:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444441002',
      customer_id: '11111111-1111-1111-1111-111111111002',
      email: 'demo@buildright.com',
      name: 'BuildRight Demo User',
      role: 'VIEWER',
      password_hash: passwordHash,
      last_login_at: '2026-03-27T14:00:00Z',
      is_active: true,
      created_at: '2026-02-05T10:00:00Z',
      updated_at: '2026-03-27T14:00:00Z',
    },
  ]);

  // --- Order Views (mirroring OTL orders) ---
  await knex('order_views').insert([
    {
      id: '44444444-4444-4444-4444-444444442001',
      external_order_id: '11111111-1111-1111-1111-111111115001',
      customer_id: '11111111-1111-1111-1111-111111111001',
      job_name: 'Tower Foundation Pour',
      site_name: 'Acme Downtown Tower',
      mix_design_name: '4000 PSI Standard',
      requested_quantity_amount: 120.00,
      requested_quantity_unit: 'CY',
      requested_delivery_date: '2026-03-28',
      status: 'CONFIRMED',
      last_synced_at: '2026-03-28T07:00:00Z',
      created_at: '2026-03-25T14:00:00Z',
      updated_at: '2026-03-27T08:00:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444442002',
      external_order_id: '11111111-1111-1111-1111-111111115002',
      customer_id: '11111111-1111-1111-1111-111111111001',
      job_name: 'Warehouse Slab',
      site_name: 'Acme Warehouse Foundation',
      mix_design_name: '4000 PSI Standard',
      requested_quantity_amount: 80.00,
      requested_quantity_unit: 'CY',
      requested_delivery_date: '2026-03-29',
      status: 'CONFIRMED',
      last_synced_at: '2026-03-28T07:00:00Z',
      created_at: '2026-03-26T10:00:00Z',
      updated_at: '2026-03-27T09:00:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444442003',
      external_order_id: '11111111-1111-1111-1111-111111115003',
      customer_id: '11111111-1111-1111-1111-111111111002',
      job_name: 'Medical Center Wing B',
      site_name: 'BuildRight Medical Center',
      mix_design_name: '5000 PSI High-Strength',
      requested_quantity_amount: 60.00,
      requested_quantity_unit: 'CY',
      requested_delivery_date: '2026-03-29',
      status: 'DRAFT',
      last_synced_at: '2026-03-28T07:00:00Z',
      created_at: '2026-03-27T16:00:00Z',
      updated_at: '2026-03-27T16:00:00Z',
    },
  ]);

  // --- Ticket Views ---
  await knex('ticket_views').insert([
    {
      id: '44444444-4444-4444-4444-444444443001',
      external_ticket_id: '11111111-1111-1111-1111-111111116001',
      order_id: '44444444-4444-4444-4444-444444442001',
      ticket_number: 'TKT-2026-0001',
      status: 'IN_PROGRESS',
      scheduled_date: '2026-03-28',
      plant_id: 'PLT-RIVER',
      last_synced_at: '2026-03-28T07:15:00Z',
      created_at: '2026-03-27T08:00:00Z',
      updated_at: '2026-03-28T07:15:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444443002',
      external_ticket_id: '11111111-1111-1111-1111-111111116002',
      order_id: '44444444-4444-4444-4444-444444442001',
      ticket_number: 'TKT-2026-0002',
      status: 'CREATED',
      scheduled_date: '2026-03-28',
      plant_id: 'PLT-RIVER',
      last_synced_at: '2026-03-28T07:00:00Z',
      created_at: '2026-03-27T08:05:00Z',
      updated_at: '2026-03-27T08:05:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444443003',
      external_ticket_id: '11111111-1111-1111-1111-111111116003',
      order_id: '44444444-4444-4444-4444-444444442002',
      ticket_number: 'TKT-2026-0003',
      status: 'CREATED',
      scheduled_date: '2026-03-29',
      plant_id: 'PLT-DTOWN',
      last_synced_at: '2026-03-28T07:00:00Z',
      created_at: '2026-03-27T09:00:00Z',
      updated_at: '2026-03-27T09:00:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444443004',
      external_ticket_id: '11111111-1111-1111-1111-111111116004',
      order_id: '44444444-4444-4444-4444-444444442003',
      ticket_number: 'TKT-2026-0004',
      status: 'CREATED',
      scheduled_date: '2026-03-29',
      plant_id: 'PLT-RIVER',
      last_synced_at: '2026-03-28T07:00:00Z',
      created_at: '2026-03-27T16:10:00Z',
      updated_at: '2026-03-27T16:10:00Z',
    },
  ]);

  // --- Load Trackers (with positions) ---
  await knex('load_trackers').insert([
    {
      id: '44444444-4444-4444-4444-444444444001',
      external_load_id: '11111111-1111-1111-1111-111111117001',
      ticket_id: '44444444-4444-4444-4444-444444443001',
      load_number: 1,
      truck_id: 'TRK-101',
      driver_id: 'DRV-001',
      status: 'COMPLETED',
      current_lat: 32.8200,
      current_lon: -96.8500,
      last_position_at: '2026-03-28T08:15:00Z',
      last_synced_at: '2026-03-28T08:20:00Z',
      created_at: '2026-03-27T08:10:00Z',
      updated_at: '2026-03-28T08:20:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444444002',
      external_load_id: '11111111-1111-1111-1111-111111117002',
      ticket_id: '44444444-4444-4444-4444-444444443001',
      load_number: 2,
      truck_id: 'TRK-102',
      driver_id: 'DRV-002',
      status: 'POURING',
      current_lat: 32.7770,
      current_lon: -96.7975,
      last_position_at: '2026-03-28T07:48:00Z',
      last_synced_at: '2026-03-28T07:50:00Z',
      created_at: '2026-03-27T08:12:00Z',
      updated_at: '2026-03-28T07:50:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444444003',
      external_load_id: '11111111-1111-1111-1111-111111117003',
      ticket_id: '44444444-4444-4444-4444-444444443001',
      load_number: 3,
      truck_id: 'TRK-103',
      driver_id: 'DRV-003',
      status: 'IN_TRANSIT',
      current_lat: 32.7900,
      current_lon: -96.8250,
      eta_minutes: 12,
      last_position_at: '2026-03-28T07:45:00Z',
      last_synced_at: '2026-03-28T07:46:00Z',
      created_at: '2026-03-27T08:14:00Z',
      updated_at: '2026-03-28T07:46:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444444004',
      external_load_id: '11111111-1111-1111-1111-111111117004',
      ticket_id: '44444444-4444-4444-4444-444444443001',
      load_number: 4,
      truck_id: 'TRK-104',
      driver_id: 'DRV-004',
      status: 'BATCHING',
      current_lat: 32.8200,
      current_lon: -96.8500,
      last_position_at: '2026-03-28T07:30:00Z',
      last_synced_at: '2026-03-28T07:32:00Z',
      created_at: '2026-03-27T08:16:00Z',
      updated_at: '2026-03-28T07:32:00Z',
    },
  ]);

  // --- Portal Messages ---
  await knex('portal_messages').insert([
    {
      id: '44444444-4444-4444-4444-444444445001',
      customer_id: '11111111-1111-1111-1111-111111111001',
      order_id: '44444444-4444-4444-4444-444444442001',
      subject: 'Delivery delay — Load 3 (TKT-2026-0001)',
      body: 'Load 3 is experiencing a traffic delay on I-35 southbound. Revised ETA is approximately 12 minutes later than originally scheduled. We are monitoring the situation and will provide updates.',
      severity: 'CRITICAL',
      is_read: false,
      created_by: 'system-dispatch',
      created_at: '2026-03-28T07:36:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444445002',
      customer_id: '11111111-1111-1111-1111-111111111001',
      order_id: '44444444-4444-4444-4444-444444442001',
      subject: 'Load 1 delivered successfully',
      body: 'Load 1 of your order ORD-2026-0001 has been delivered and pour completed at the Acme Downtown Tower site. 10 CY of 4000 PSI Standard mix placed. Ticket: TKT-2026-0001.',
      severity: 'INFO',
      is_read: true,
      created_by: 'system-dispatch',
      created_at: '2026-03-28T07:50:00Z',
    },
    {
      id: '44444444-4444-4444-4444-444444445003',
      customer_id: '11111111-1111-1111-1111-111111111002',
      order_id: '44444444-4444-4444-4444-444444442003',
      subject: 'Order confirmation pending',
      body: 'Your order ORD-2026-0003 for Medical Center Wing B (60 CY of 5000 PSI High-Strength) is currently in DRAFT status. Please confirm the order to schedule delivery for March 29.',
      severity: 'WARNING',
      is_read: false,
      created_by: 'system-portal',
      created_at: '2026-03-28T08:00:00Z',
    },
  ]);
}
