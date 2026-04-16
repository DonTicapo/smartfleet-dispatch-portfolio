import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sap_sync_cursors', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('entity_type').notNullable().unique();
    t.timestamp('last_synced_at', { useTz: true });
    t.integer('records_synced').notNullable().defaultTo(0);
    t.text('status').notNullable().defaultTo('IDLE');
    t.text('error_message');
    t.timestamp('started_at', { useTz: true });
    t.timestamp('completed_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.index('entity_type');
    t.index('status');
  });

  await knex.schema.createTable('sap_entity_mappings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('entity_type').notNullable();
    t.text('sap_key').notNullable();
    t.text('smartfleet_id').notNullable();
    t.text('sap_company_db').notNullable();
    t.timestamp('synced_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['entity_type', 'sap_key', 'sap_company_db']);
    t.index(['entity_type', 'sap_company_db']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sap_entity_mappings');
  await knex.schema.dropTableIfExists('sap_sync_cursors');
}
