import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('tracker_assets', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.integer('navixy_tracker_id').notNullable().unique();
    t.text('label').notNullable();
    t.text('truck_id');
    t.text('model');
    t.text('status').notNullable().defaultTo('ACTIVE');
    t.decimal('last_latitude', 10, 7);
    t.decimal('last_longitude', 10, 7);
    t.timestamp('last_position_at', { useTz: true });
    t.integer('navixy_group_id');
    t.timestamp('synced_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('truck_id');
  });

  await knex.schema.createTable('positions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tracker_asset_id').notNullable().references('id').inTable('tracker_assets');
    t.decimal('latitude', 10, 7).notNullable();
    t.decimal('longitude', 10, 7).notNullable();
    t.decimal('altitude', 8, 2);
    t.decimal('speed', 8, 2);
    t.decimal('heading', 5, 2);
    t.decimal('accuracy', 8, 2);
    t.timestamp('recorded_at', { useTz: true }).notNullable();
    t.timestamp('received_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(['tracker_asset_id', 'recorded_at']);
  });

  await knex.schema.createTable('trips', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tracker_asset_id').notNullable().references('id').inTable('tracker_assets');
    t.integer('navixy_trip_id');
    t.timestamp('start_at', { useTz: true }).notNullable();
    t.timestamp('end_at', { useTz: true });
    t.decimal('start_latitude', 10, 7).notNullable();
    t.decimal('start_longitude', 10, 7).notNullable();
    t.decimal('end_latitude', 10, 7);
    t.decimal('end_longitude', 10, 7);
    t.integer('distance_meters');
    t.text('status').notNullable().defaultTo('IN_PROGRESS');
    t.uuid('load_id');
    t.timestamp('synced_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['tracker_asset_id', 'navixy_trip_id']);
    t.index('tracker_asset_id');
    t.index('load_id');
  });

  await knex.schema.createTable('routes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('trip_id').notNullable().references('id').inTable('trips').unique();
    t.jsonb('points').notNullable();
    t.timestamp('fetched_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('geofence_zones', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.integer('navixy_geofence_id').unique();
    t.text('name').notNullable();
    t.text('zone_type').notNullable();
    t.decimal('latitude', 10, 7).notNullable();
    t.decimal('longitude', 10, 7).notNullable();
    t.integer('radius_meters').notNullable();
    t.uuid('site_id');
    t.text('plant_id');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('zone_type');
  });

  await knex.schema.createTable('geofence_events', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tracker_asset_id').notNullable().references('id').inTable('tracker_assets');
    t.uuid('geofence_zone_id').notNullable().references('id').inTable('geofence_zones');
    t.text('transition').notNullable();
    t.decimal('latitude', 10, 7).notNullable();
    t.decimal('longitude', 10, 7).notNullable();
    t.timestamp('occurred_at', { useTz: true }).notNullable();
    t.text('navixy_event_id').unique();
    t.timestamp('processed_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(['tracker_asset_id', 'occurred_at']);
    t.index('geofence_zone_id');
  });

  await knex.schema.createTable('outbound_events', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('event_type').notNullable();
    t.text('target_url').notNullable();
    t.jsonb('payload').notNullable();
    t.text('status').notNullable().defaultTo('PENDING');
    t.integer('attempts').notNullable().defaultTo(0);
    t.timestamp('last_attempt_at', { useTz: true });
    t.text('last_error');
    t.timestamp('next_retry_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index(['status', 'next_retry_at']);
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
  await knex.schema.dropTableIfExists('outbound_events');
  await knex.schema.dropTableIfExists('geofence_events');
  await knex.schema.dropTableIfExists('geofence_zones');
  await knex.schema.dropTableIfExists('routes');
  await knex.schema.dropTableIfExists('trips');
  await knex.schema.dropTableIfExists('positions');
  await knex.schema.dropTableIfExists('tracker_assets');
}
