import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('plants', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('code').notNullable().unique();
    t.text('name').notNullable();
    t.jsonb('location');
    t.text('timezone').notNullable().defaultTo('America/Chicago');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('mixers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('plant_id').notNullable().references('id').inTable('plants');
    t.text('code').notNullable();
    t.text('name').notNullable();
    t.text('type').notNullable();
    t.decimal('capacity_cy', 8, 2).notNullable();
    t.text('status').notNullable().defaultTo('IDLE');
    t.timestamp('last_status_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['plant_id', 'code']);
    t.index('plant_id');
  });

  await knex.schema.createTable('batch_events', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('event_id').notNullable().unique();
    t.uuid('plant_id').notNullable().references('id').inTable('plants');
    t.uuid('mixer_id').notNullable().references('id').inTable('mixers');
    t.text('ticket_number');
    t.text('batch_number').notNullable();
    t.text('event_type').notNullable();
    t.jsonb('payload').notNullable().defaultTo('{}');
    t.timestamp('occurred_at', { useTz: true }).notNullable();
    t.timestamp('received_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('plant_id');
    t.index('mixer_id');
    t.index('ticket_number');
    t.index('occurred_at');
  });

  await knex.schema.createTable('scale_readings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('plant_id').notNullable().references('id').inTable('plants');
    t.uuid('mixer_id').notNullable().references('id').inTable('mixers');
    t.text('batch_number');
    t.text('material_type').notNullable();
    t.decimal('target_weight', 10, 2).notNullable();
    t.decimal('actual_weight', 10, 2).notNullable();
    t.text('unit').notNullable().defaultTo('LB');
    t.decimal('tolerance', 5, 2).notNullable();
    t.boolean('within_tolerance').notNullable();
    t.timestamp('recorded_at', { useTz: true }).notNullable();
    t.timestamp('received_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('plant_id');
    t.index('mixer_id');
    t.index('batch_number');
    t.index('recorded_at');
  });

  await knex.schema.createTable('mixer_status_log', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('plant_id').notNullable().references('id').inTable('plants');
    t.uuid('mixer_id').notNullable().references('id').inTable('mixers');
    t.text('previous_status');
    t.text('current_status').notNullable();
    t.text('reason');
    t.text('operator_id');
    t.timestamp('occurred_at', { useTz: true }).notNullable();
    t.timestamp('received_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('mixer_id');
    t.index('occurred_at');
  });

  await knex.schema.createTable('outbound_events', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('event_type').notNullable();
    t.jsonb('payload').notNullable();
    t.text('target_service').notNullable();
    t.text('status').notNullable().defaultTo('PENDING');
    t.integer('attempts').notNullable().defaultTo(0);
    t.integer('max_attempts').notNullable().defaultTo(5);
    t.timestamp('last_attempt_at', { useTz: true });
    t.timestamp('next_retry_at', { useTz: true });
    t.timestamp('sent_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('status');
    t.index('next_retry_at');
  });

  await knex.schema.createTable('heartbeats', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('plant_id').notNullable().references('id').inTable('plants');
    t.integer('uptime_seconds').notNullable();
    t.decimal('cpu_percent', 5, 2).notNullable();
    t.decimal('memory_percent', 5, 2).notNullable();
    t.decimal('disk_percent', 5, 2).notNullable();
    t.integer('pending_outbound').notNullable().defaultTo(0);
    t.timestamp('last_cloud_sync_at', { useTz: true });
    t.timestamp('reported_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('plant_id');
    t.index('reported_at');
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
  await knex.schema.dropTableIfExists('heartbeats');
  await knex.schema.dropTableIfExists('outbound_events');
  await knex.schema.dropTableIfExists('mixer_status_log');
  await knex.schema.dropTableIfExists('scale_readings');
  await knex.schema.dropTableIfExists('batch_events');
  await knex.schema.dropTableIfExists('mixers');
  await knex.schema.dropTableIfExists('plants');
}
