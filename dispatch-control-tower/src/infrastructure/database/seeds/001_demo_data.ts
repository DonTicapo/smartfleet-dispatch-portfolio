import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data in reverse dependency order
  await knex('audit_log').del();
  await knex('dispatch_board').del();
  await knex('dispatch_exceptions').del();
  await knex('assignments').del();
  await knex('drivers').del();
  await knex('trucks').del();

  // --- Trucks ---
  await knex('trucks').insert([
    {
      id: '33333333-3333-3333-3333-333333331001',
      external_id: 'TRK-101',
      number: 'TRK-101',
      license_plate: 'TX-CMX-101',
      capacity_amount: 10.00,
      capacity_unit: 'CY',
      status: 'DISPATCHED',
      home_plant_id: 'PLT-RIVER',
      notes: 'Primary mixer truck — Kenworth T880',
      created_at: '2026-01-10T08:00:00Z',
      updated_at: '2026-03-28T06:50:00Z',
    },
    {
      id: '33333333-3333-3333-3333-333333331002',
      external_id: 'TRK-102',
      number: 'TRK-102',
      license_plate: 'TX-CMX-102',
      capacity_amount: 10.00,
      capacity_unit: 'CY',
      status: 'DISPATCHED',
      home_plant_id: 'PLT-RIVER',
      notes: 'Kenworth T880',
      created_at: '2026-01-10T08:00:00Z',
      updated_at: '2026-03-28T07:00:00Z',
    },
    {
      id: '33333333-3333-3333-3333-333333331003',
      external_id: 'TRK-103',
      number: 'TRK-103',
      license_plate: 'TX-CMX-103',
      capacity_amount: 8.00,
      capacity_unit: 'CY',
      status: 'DISPATCHED',
      home_plant_id: 'PLT-RIVER',
      notes: 'Smaller mixer — Mack Granite',
      created_at: '2026-01-12T08:00:00Z',
      updated_at: '2026-03-28T07:15:00Z',
    },
    {
      id: '33333333-3333-3333-3333-333333331004',
      external_id: 'TRK-104',
      number: 'TRK-104',
      license_plate: 'TX-CMX-104',
      capacity_amount: 10.00,
      capacity_unit: 'CY',
      status: 'AVAILABLE',
      home_plant_id: 'PLT-DTOWN',
      notes: 'Peterbilt 520 — downtown plant',
      created_at: '2026-02-01T08:00:00Z',
      updated_at: '2026-03-28T06:00:00Z',
    },
  ]);

  // --- Drivers ---
  await knex('drivers').insert([
    {
      id: '33333333-3333-3333-3333-333333332001',
      external_id: 'DRV-001',
      first_name: 'Carlos',
      last_name: 'Rodriguez',
      phone: '555-301-1001',
      license_number: 'CDL-TX-44201',
      status: 'ON_DUTY',
      default_truck_id: '33333333-3333-3333-3333-333333331001',
      notes: '12 years experience, pump-truck certified',
      created_at: '2026-01-10T08:00:00Z',
      updated_at: '2026-03-28T06:30:00Z',
    },
    {
      id: '33333333-3333-3333-3333-333333332002',
      external_id: 'DRV-002',
      first_name: 'Maria',
      last_name: 'Santos',
      phone: '555-301-1002',
      license_number: 'CDL-TX-44202',
      status: 'ON_DUTY',
      default_truck_id: '33333333-3333-3333-3333-333333331002',
      notes: '8 years experience',
      created_at: '2026-01-10T08:00:00Z',
      updated_at: '2026-03-28T06:30:00Z',
    },
    {
      id: '33333333-3333-3333-3333-333333332003',
      external_id: 'DRV-003',
      first_name: 'James',
      last_name: 'Mitchell',
      phone: '555-301-1003',
      license_number: 'CDL-TX-44203',
      status: 'ON_DUTY',
      default_truck_id: '33333333-3333-3333-3333-333333331003',
      notes: '5 years experience',
      created_at: '2026-01-15T08:00:00Z',
      updated_at: '2026-03-28T06:30:00Z',
    },
    {
      id: '33333333-3333-3333-3333-333333332004',
      external_id: 'DRV-004',
      first_name: 'Robert',
      last_name: 'Chen',
      phone: '555-301-1004',
      license_number: 'CDL-TX-44204',
      status: 'AVAILABLE',
      default_truck_id: '33333333-3333-3333-3333-333333331004',
      notes: '3 years experience, downtown plant regular',
      created_at: '2026-02-01T08:00:00Z',
      updated_at: '2026-03-28T06:00:00Z',
    },
  ]);

  // --- Assignments (linking trucks/drivers to loads) ---
  await knex('assignments').insert([
    {
      id: '33333333-3333-3333-3333-333333333001',
      load_id: '11111111-1111-1111-1111-111111117001',
      truck_id: '33333333-3333-3333-3333-333333331001',
      driver_id: '33333333-3333-3333-3333-333333332001',
      status: 'COMPLETED',
      assigned_by: 'dispatcher@smartfleet.com',
      assigned_at: '2026-03-28T06:30:00Z',
      confirmed_at: '2026-03-28T06:35:00Z',
      completed_at: '2026-03-28T08:15:00Z',
      notes: 'Load 1 of TKT-2026-0001 — completed on time',
      created_at: '2026-03-28T06:30:00Z',
      updated_at: '2026-03-28T08:15:00Z',
    },
    {
      id: '33333333-3333-3333-3333-333333333002',
      load_id: '11111111-1111-1111-1111-111111117002',
      truck_id: '33333333-3333-3333-3333-333333331002',
      driver_id: '33333333-3333-3333-3333-333333332002',
      status: 'CONFIRMED',
      assigned_by: 'dispatcher@smartfleet.com',
      assigned_at: '2026-03-28T06:45:00Z',
      confirmed_at: '2026-03-28T06:50:00Z',
      notes: 'Load 2 of TKT-2026-0001 — currently pouring on site',
      created_at: '2026-03-28T06:45:00Z',
      updated_at: '2026-03-28T06:50:00Z',
    },
    {
      id: '33333333-3333-3333-3333-333333333003',
      load_id: '11111111-1111-1111-1111-111111117003',
      truck_id: '33333333-3333-3333-3333-333333331003',
      driver_id: '33333333-3333-3333-3333-333333332003',
      status: 'CONFIRMED',
      assigned_by: 'dispatcher@smartfleet.com',
      assigned_at: '2026-03-28T07:00:00Z',
      confirmed_at: '2026-03-28T07:05:00Z',
      notes: 'Load 3 of TKT-2026-0001 — in transit to site',
      created_at: '2026-03-28T07:00:00Z',
      updated_at: '2026-03-28T07:05:00Z',
    },
  ]);

  // --- Dispatch Exceptions ---
  await knex('dispatch_exceptions').insert([
    {
      id: '33333333-3333-3333-3333-333333334001',
      load_id: '11111111-1111-1111-1111-111111117003',
      assignment_id: '33333333-3333-3333-3333-333333333003',
      truck_id: '33333333-3333-3333-3333-333333331003',
      type: 'DELAY',
      severity: 'MEDIUM',
      status: 'OPEN',
      title: 'Traffic delay on I-35',
      description: 'Truck-103 reporting heavy traffic on I-35 southbound. ETA pushed 15 minutes. Load 3 may arrive outside pour window.',
      reported_by: 'system-telematics',
      created_at: '2026-03-28T07:35:00Z',
      updated_at: '2026-03-28T07:35:00Z',
    },
    {
      id: '33333333-3333-3333-3333-333333334002',
      load_id: '11111111-1111-1111-1111-111111117001',
      assignment_id: '33333333-3333-3333-3333-333333333001',
      truck_id: '33333333-3333-3333-3333-333333331001',
      type: 'NO_SHOW',
      severity: 'HIGH',
      status: 'RESOLVED',
      title: 'Site contact unavailable at arrival',
      description: 'Driver arrived at Acme Downtown Tower but site foreman was not at the south gate. Waited 10 minutes.',
      reported_by: 'DRV-001',
      resolved_by: 'dispatcher@smartfleet.com',
      resolved_at: '2026-03-28T07:35:00Z',
      resolution: 'Foreman was at north entrance. Redirected driver. Pour started 5 min late.',
      created_at: '2026-03-28T07:20:00Z',
      updated_at: '2026-03-28T07:35:00Z',
    },
  ]);
}
