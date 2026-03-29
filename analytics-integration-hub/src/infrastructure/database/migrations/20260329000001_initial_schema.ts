import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('ingest_events', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('event_id').notNullable().unique();
    t.text('source').notNullable();
    t.text('event_type').notNullable();
    t.text('aggregate_type').notNullable();
    t.text('aggregate_id').notNullable();
    t.jsonb('payload').notNullable().defaultTo('{}');
    t.timestamp('occurred_at', { useTz: true }).notNullable();
    t.timestamp('received_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('processed_at', { useTz: true });
    t.index('source');
    t.index('event_type');
    t.index(['aggregate_type', 'aggregate_id']);
    t.index('occurred_at');
  });

  await knex.schema.createTable('kpi_definitions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable().unique();
    t.text('display_name').notNullable();
    t.text('description').notNullable();
    t.text('unit').notNullable();
    t.text('dimension').notNullable();
    t.text('formula').notNullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('kpi_snapshots', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('kpi_name').notNullable();
    t.text('dimension').notNullable();
    t.text('dimension_id').notNullable();
    t.decimal('value', 14, 4).notNullable();
    t.text('unit').notNullable();
    t.timestamp('period_start', { useTz: true }).notNullable();
    t.timestamp('period_end', { useTz: true }).notNullable();
    t.timestamp('computed_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('kpi_name');
    t.index(['dimension', 'dimension_id']);
    t.index('period_start');
    t.index('period_end');
  });

  await knex.schema.createTable('erp_export_jobs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('export_type').notNullable();
    t.text('status').notNullable().defaultTo('PENDING');
    t.jsonb('filters').notNullable().defaultTo('{}');
    t.text('result_url');
    t.text('error_message');
    t.text('requested_by').notNullable();
    t.timestamp('started_at', { useTz: true });
    t.timestamp('completed_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('status');
    t.index('export_type');
  });

  await knex.schema.createTable('webhook_subscriptions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('url').notNullable();
    t.specificType('event_types', 'text[]').notNullable();
    t.text('secret').notNullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('last_delivered_at', { useTz: true });
    t.integer('failure_count').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('is_active');
  });

  await knex.schema.createTable('webhook_deliveries', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('subscription_id').notNullable().references('id').inTable('webhook_subscriptions').onDelete('CASCADE');
    t.text('event_id').notNullable();
    t.text('status').notNullable().defaultTo('PENDING');
    t.integer('http_status');
    t.text('response_body');
    t.integer('attempts').notNullable().defaultTo(0);
    t.timestamp('last_attempt_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('subscription_id');
    t.index('event_id');
    t.index('status');
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
  await knex.schema.dropTableIfExists('webhook_deliveries');
  await knex.schema.dropTableIfExists('webhook_subscriptions');
  await knex.schema.dropTableIfExists('erp_export_jobs');
  await knex.schema.dropTableIfExists('kpi_snapshots');
  await knex.schema.dropTableIfExists('kpi_definitions');
  await knex.schema.dropTableIfExists('ingest_events');
}
