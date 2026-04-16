import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('portal_users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('customer_id').notNullable();
    t.text('email').notNullable().unique();
    t.text('name').notNullable();
    t.text('role').notNullable().defaultTo('VIEWER');
    t.text('password_hash').notNullable();
    t.timestamp('last_login_at', { useTz: true });
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('customer_id');
  });

  await knex.schema.createTable('order_views', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('external_order_id').notNullable().unique();
    t.uuid('customer_id').notNullable();
    t.text('job_name').notNullable();
    t.text('site_name').notNullable();
    t.text('mix_design_name').notNullable();
    t.decimal('requested_quantity_amount', 10, 2).notNullable();
    t.text('requested_quantity_unit').notNullable().defaultTo('M3');
    t.date('requested_delivery_date').notNullable();
    t.text('status').notNullable().defaultTo('DRAFT');
    t.timestamp('last_synced_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('customer_id');
    t.index('status');
  });

  await knex.schema.createTable('ticket_views', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('external_ticket_id').notNullable().unique();
    t.uuid('order_id').notNullable().references('id').inTable('order_views');
    t.text('ticket_number').notNullable();
    t.text('status').notNullable().defaultTo('CREATED');
    t.date('scheduled_date').notNullable();
    t.text('plant_id');
    t.timestamp('last_synced_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('order_id');
    t.index('status');
  });

  await knex.schema.createTable('load_trackers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('external_load_id').notNullable().unique();
    t.uuid('ticket_id').notNullable().references('id').inTable('ticket_views');
    t.integer('load_number').notNullable();
    t.text('truck_id');
    t.text('driver_id');
    t.text('status').notNullable().defaultTo('SCHEDULED');
    t.decimal('current_lat', 10, 7);
    t.decimal('current_lon', 10, 7);
    t.integer('eta_minutes');
    t.timestamp('last_position_at', { useTz: true });
    t.timestamp('last_synced_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('ticket_id');
    t.index('status');
  });

  await knex.schema.createTable('portal_messages', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('customer_id').notNullable();
    t.uuid('order_id');
    t.text('subject').notNullable();
    t.text('body').notNullable();
    t.text('severity').notNullable().defaultTo('INFO');
    t.boolean('is_read').notNullable().defaultTo(false);
    t.text('created_by').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('customer_id');
    t.index('order_id');
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
  await knex.schema.dropTableIfExists('portal_messages');
  await knex.schema.dropTableIfExists('load_trackers');
  await knex.schema.dropTableIfExists('ticket_views');
  await knex.schema.dropTableIfExists('order_views');
  await knex.schema.dropTableIfExists('portal_users');
}
