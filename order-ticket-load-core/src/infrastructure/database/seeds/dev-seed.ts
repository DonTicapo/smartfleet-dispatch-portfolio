import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('delivery_state_events').del();
  await knex('loads').del();
  await knex('tickets').del();
  await knex('orders').del();
  await knex('mix_designs').del();
  await knex('jobs').del();
  await knex('sites').del();
  await knex('customers').del();

  await knex('mix_designs').insert([
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      code: '3000-STD',
      name: '3000 PSI Standard',
      strength_psi: 3000,
      slump_inches: 4.0,
      version: 1,
      is_active: true,
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      code: '4000-HE',
      name: '4000 PSI High-Early',
      strength_psi: 4000,
      slump_inches: 5.0,
      version: 1,
      is_active: true,
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      code: '5000-HP',
      name: '5000 PSI High-Performance',
      strength_psi: 5000,
      slump_inches: 6.0,
      version: 1,
      is_active: true,
    },
  ]);

  await knex('customers').insert({
    id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Acme Construction',
    contact_email: 'dispatch@acme.example.com',
    contact_phone: '555-0100',
    billing_address: JSON.stringify({
      line1: '100 Main St',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'US',
    }),
  });

  await knex('sites').insert({
    id: 's0000000-0000-0000-0000-000000000001',
    customer_id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Downtown Tower Project',
    address: JSON.stringify({
      line1: '200 Commerce Ave',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62702',
      country: 'US',
    }),
    geo_point: JSON.stringify({ latitude: 39.7817, longitude: -89.6501 }),
    geofence_radius_meters: 200,
  });

  await knex('jobs').insert({
    id: 'j0000000-0000-0000-0000-000000000001',
    customer_id: 'c0000000-0000-0000-0000-000000000001',
    site_id: 's0000000-0000-0000-0000-000000000001',
    name: 'Foundation Pour - Phase 1',
    description: 'Main building foundation, 500 CY total',
    start_date: '2026-04-01',
    end_date: '2026-04-15',
  });
}
