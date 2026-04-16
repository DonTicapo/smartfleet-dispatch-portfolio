import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('trucks', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('external_id').unique();
    t.text('number').notNullable().unique();
    t.text('license_plate');
    t.decimal('capacity_amount', 10, 2);
    t.text('capacity_unit').defaultTo('M3');
    t.text('status').notNullable().defaultTo('AVAILABLE');
    t.text('home_plant_id');
    t.text('notes');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('status');
  });

  await knex.schema.createTable('drivers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('external_id').unique();
    t.text('first_name').notNullable();
    t.text('last_name').notNullable();
    t.text('phone');
    t.text('license_number');
    t.text('status').notNullable().defaultTo('AVAILABLE');
    t.uuid('default_truck_id').references('id').inTable('trucks');
    t.text('notes');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('status');
  });

  await knex.schema.createTable('assignments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('load_id').notNullable();
    t.uuid('truck_id').notNullable().references('id').inTable('trucks');
    t.uuid('driver_id').notNullable().references('id').inTable('drivers');
    t.text('status').notNullable().defaultTo('PENDING');
    t.text('assigned_by').notNullable();
    t.timestamp('assigned_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('confirmed_at', { useTz: true });
    t.timestamp('completed_at', { useTz: true });
    t.timestamp('cancelled_at', { useTz: true });
    t.text('cancellation_reason');
    t.text('notes');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('load_id');
    t.index('truck_id');
    t.index('driver_id');
    t.index('status');
  });

  // Partial unique index: one active assignment per load
  await knex.raw(`
    CREATE UNIQUE INDEX idx_assignments_active_load
    ON assignments (load_id)
    WHERE status NOT IN ('CANCELLED', 'COMPLETED')
  `);

  await knex.schema.createTable('dispatch_exceptions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('load_id');
    t.uuid('assignment_id').references('id').inTable('assignments');
    t.uuid('truck_id').references('id').inTable('trucks');
    t.text('type').notNullable();
    t.text('severity').notNullable().defaultTo('MEDIUM');
    t.text('status').notNullable().defaultTo('OPEN');
    t.text('title').notNullable();
    t.text('description');
    t.text('reported_by').notNullable();
    t.text('resolved_by');
    t.timestamp('resolved_at', { useTz: true });
    t.text('resolution');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('status');
    t.index('type');
    t.index('load_id');
  });

  await knex.schema.createTable('dispatch_board', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable();
    t.text('load_id').notNullable();
    t.text('order_id').notNullable();
    t.text('ticket_id').notNullable();
    t.text('ticket_number').notNullable();
    t.text('customer_name').notNullable();
    t.text('site_name').notNullable();
    t.text('mix_design_code').notNullable();
    t.decimal('requested_quantity_amount', 10, 2);
    t.text('requested_quantity_unit').defaultTo('M3');
    t.text('load_status').notNullable();
    t.uuid('truck_id').references('id').inTable('trucks');
    t.text('truck_number');
    t.uuid('driver_id').references('id').inTable('drivers');
    t.text('driver_name');
    t.uuid('assignment_id').references('id').inTable('assignments');
    t.text('assignment_status');
    t.text('scheduled_time');
    t.boolean('has_exceptions').notNullable().defaultTo(false);
    t.timestamp('last_refreshed_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['date', 'load_id']);
    t.index('date');
    t.index('load_status');
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
  await knex.schema.dropTableIfExists('dispatch_board');
  await knex.schema.dropTableIfExists('dispatch_exceptions');
  await knex.schema.dropTableIfExists('assignments');
  await knex.schema.dropTableIfExists('drivers');
  await knex.schema.dropTableIfExists('trucks');
}
