import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('customers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('external_id').unique();
    t.text('name').notNullable();
    t.text('contact_email');
    t.text('contact_phone');
    t.jsonb('billing_address');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('sites', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('customer_id').notNullable().references('id').inTable('customers');
    t.text('name').notNullable();
    t.jsonb('address').notNullable();
    t.jsonb('geo_point');
    t.integer('geofence_radius_meters');
    t.text('notes');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('customer_id');
  });

  await knex.schema.createTable('jobs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('customer_id').notNullable().references('id').inTable('customers');
    t.uuid('site_id').notNullable().references('id').inTable('sites');
    t.text('name').notNullable();
    t.text('description');
    t.date('start_date');
    t.date('end_date');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('customer_id');
    t.index('site_id');
  });

  await knex.schema.createTable('mix_designs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('code').notNullable();
    t.text('name').notNullable();
    t.text('description');
    t.integer('strength_psi');
    t.decimal('slump_inches', 5, 2);
    t.integer('version').notNullable().defaultTo(1);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['code', 'version']);
  });

  await knex.schema.createTable('orders', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('external_id').unique();
    t.uuid('customer_id').notNullable().references('id').inTable('customers');
    t.uuid('job_id').notNullable().references('id').inTable('jobs');
    t.uuid('mix_design_id').notNullable().references('id').inTable('mix_designs');
    t.decimal('requested_quantity_amount', 10, 2).notNullable();
    t.text('requested_quantity_unit').notNullable().defaultTo('CY');
    t.date('requested_delivery_date').notNullable();
    t.text('requested_delivery_time');
    t.text('special_instructions');
    t.text('status').notNullable().defaultTo('DRAFT');
    t.text('created_by').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('customer_id');
    t.index('job_id');
    t.index('status');
  });

  await knex.schema.createTable('tickets', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('order_id').notNullable().references('id').inTable('orders');
    t.text('ticket_number').notNullable().unique();
    t.text('status').notNullable().defaultTo('CREATED');
    t.date('scheduled_date').notNullable();
    t.text('plant_id');
    t.text('notes');
    t.text('created_by').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('order_id');
    t.index('status');
    t.index('scheduled_date');
  });

  await knex.schema.createTable('loads', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('ticket_id').notNullable().references('id').inTable('tickets');
    t.integer('load_number').notNullable();
    t.text('truck_id');
    t.text('driver_id');
    t.uuid('mix_design_id').notNullable().references('id').inTable('mix_designs');
    t.decimal('actual_quantity_amount', 10, 2);
    t.text('actual_quantity_unit').defaultTo('CY');
    t.text('status').notNullable().defaultTo('SCHEDULED');
    t.timestamp('batched_at', { useTz: true });
    t.timestamp('departed_plant_at', { useTz: true });
    t.timestamp('arrived_site_at', { useTz: true });
    t.timestamp('pour_started_at', { useTz: true });
    t.timestamp('pour_completed_at', { useTz: true });
    t.timestamp('returned_plant_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['ticket_id', 'load_number']);
    t.index('ticket_id');
    t.index('status');
  });

  await knex.schema.createTable('delivery_state_events', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('event_id').notNullable().unique();
    t.uuid('load_id').notNullable().references('id').inTable('loads');
    t.text('state').notNullable();
    t.timestamp('occurred_at', { useTz: true }).notNullable();
    t.text('source').notNullable();
    t.text('source_event_id');
    t.jsonb('payload');
    t.timestamp('received_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('load_id');
    t.index('occurred_at');
  });

  await knex.schema.createTable('audit_log', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('entity_type').notNullable();
    t.uuid('entity_id').notNullable();
    t.text('action').notNullable();
    t.text('actor').notNullable();
    t.jsonb('changes');
    t.text('request_id');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(['entity_type', 'entity_id']);
    t.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_log');
  await knex.schema.dropTableIfExists('delivery_state_events');
  await knex.schema.dropTableIfExists('loads');
  await knex.schema.dropTableIfExists('tickets');
  await knex.schema.dropTableIfExists('orders');
  await knex.schema.dropTableIfExists('mix_designs');
  await knex.schema.dropTableIfExists('jobs');
  await knex.schema.dropTableIfExists('sites');
  await knex.schema.dropTableIfExists('customers');
}
