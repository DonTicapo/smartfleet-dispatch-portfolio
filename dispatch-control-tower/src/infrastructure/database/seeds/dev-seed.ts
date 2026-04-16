import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('dispatch_board').del();
  await knex('dispatch_exceptions').del();
  await knex('assignments').del();
  await knex('drivers').del();
  await knex('trucks').del();

  const trucks = [
    { id: 't0000000-0000-0000-0000-000000000001', number: 'T-101', license_plate: 'ABC-1234', capacity_amount: 10, capacity_unit: 'M3', status: 'AVAILABLE' },
    { id: 't0000000-0000-0000-0000-000000000002', number: 'T-102', license_plate: 'DEF-5678', capacity_amount: 10, capacity_unit: 'M3', status: 'AVAILABLE' },
    { id: 't0000000-0000-0000-0000-000000000003', number: 'T-103', license_plate: 'GHI-9012', capacity_amount: 8, capacity_unit: 'M3', status: 'AVAILABLE' },
  ];
  await knex('trucks').insert(trucks);

  const drivers = [
    { id: 'd0000000-0000-0000-0000-000000000001', first_name: 'John', last_name: 'Smith', phone: '555-0201', license_number: 'CDL-001', status: 'AVAILABLE', default_truck_id: 't0000000-0000-0000-0000-000000000001' },
    { id: 'd0000000-0000-0000-0000-000000000002', first_name: 'Maria', last_name: 'Garcia', phone: '555-0202', license_number: 'CDL-002', status: 'AVAILABLE', default_truck_id: 't0000000-0000-0000-0000-000000000002' },
    { id: 'd0000000-0000-0000-0000-000000000003', first_name: 'James', last_name: 'Wilson', phone: '555-0203', license_number: 'CDL-003', status: 'AVAILABLE' },
  ];
  await knex('drivers').insert(drivers);
}
