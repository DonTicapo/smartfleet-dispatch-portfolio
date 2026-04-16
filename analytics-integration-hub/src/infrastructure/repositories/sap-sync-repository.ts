import type { Knex } from 'knex';
import type { SapSyncCursor, SapEntityMapping } from '../../domain/entities/sap-sync-cursor.js';
import type { SapSyncEntityType } from '../../domain/enums/sap-sync-entity-type.js';
import type { SapSyncStatus } from '../../domain/enums/sap-sync-status.js';

interface SyncCursorRow {
  id: string;
  entity_type: string;
  last_synced_at: Date | null;
  records_synced: number;
  status: string;
  error_message: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface EntityMappingRow {
  id: string;
  entity_type: string;
  sap_key: string;
  smartfleet_id: string;
  sap_company_db: string;
  synced_at: Date;
  created_at: Date;
}

function toCursorEntity(row: SyncCursorRow): SapSyncCursor {
  return {
    id: row.id,
    entityType: row.entity_type as SapSyncEntityType,
    lastSyncedAt: row.last_synced_at,
    recordsSynced: row.records_synced,
    status: row.status as SapSyncStatus,
    errorMessage: row.error_message,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMappingEntity(row: EntityMappingRow): SapEntityMapping {
  return {
    id: row.id,
    entityType: row.entity_type as SapSyncEntityType,
    sapKey: row.sap_key,
    smartfleetId: row.smartfleet_id,
    sapCompanyDb: row.sap_company_db,
    syncedAt: row.synced_at,
    createdAt: row.created_at,
  };
}

export class SapSyncRepository {
  constructor(private db: Knex) {}

  async getCursor(entityType: SapSyncEntityType): Promise<SapSyncCursor | null> {
    const row = await this.db('sap_sync_cursors').where({ entity_type: entityType }).first();
    return row ? toCursorEntity(row) : null;
  }

  async listCursors(): Promise<SapSyncCursor[]> {
    const rows = await this.db('sap_sync_cursors').orderBy('entity_type');
    return rows.map(toCursorEntity);
  }

  async upsertCursor(
    entityType: SapSyncEntityType,
    data: {
      status: SapSyncStatus;
      lastSyncedAt?: Date;
      recordsSynced?: number;
      errorMessage?: string | null;
      startedAt?: Date;
      completedAt?: Date;
    },
    trx?: Knex.Transaction,
  ): Promise<SapSyncCursor> {
    const qb = trx || this.db;
    const now = new Date();

    const updates: Record<string, unknown> = {
      status: data.status,
      updated_at: now,
    };
    if (data.lastSyncedAt !== undefined) updates.last_synced_at = data.lastSyncedAt;
    if (data.recordsSynced !== undefined) updates.records_synced = data.recordsSynced;
    if (data.errorMessage !== undefined) updates.error_message = data.errorMessage;
    if (data.startedAt !== undefined) updates.started_at = data.startedAt;
    if (data.completedAt !== undefined) updates.completed_at = data.completedAt;

    const [row] = await qb('sap_sync_cursors')
      .insert({
        entity_type: entityType,
        ...updates,
        created_at: now,
      })
      .onConflict('entity_type')
      .merge(updates)
      .returning('*');

    return toCursorEntity(row);
  }

  async getMapping(
    entityType: SapSyncEntityType,
    sapKey: string,
    companyDb: string,
  ): Promise<SapEntityMapping | null> {
    const row = await this.db('sap_entity_mappings')
      .where({ entity_type: entityType, sap_key: sapKey, sap_company_db: companyDb })
      .first();
    return row ? toMappingEntity(row) : null;
  }

  async upsertMapping(
    data: {
      entityType: SapSyncEntityType;
      sapKey: string;
      smartfleetId: string;
      sapCompanyDb: string;
    },
    trx?: Knex.Transaction,
  ): Promise<SapEntityMapping> {
    const qb = trx || this.db;
    const now = new Date();

    const [row] = await qb('sap_entity_mappings')
      .insert({
        entity_type: data.entityType,
        sap_key: data.sapKey,
        smartfleet_id: data.smartfleetId,
        sap_company_db: data.sapCompanyDb,
        synced_at: now,
      })
      .onConflict(['entity_type', 'sap_key', 'sap_company_db'])
      .merge({ smartfleet_id: data.smartfleetId, synced_at: now })
      .returning('*');

    return toMappingEntity(row);
  }

  async getMappingsForType(
    entityType: SapSyncEntityType,
    companyDb: string,
  ): Promise<SapEntityMapping[]> {
    const rows = await this.db('sap_entity_mappings')
      .where({ entity_type: entityType, sap_company_db: companyDb });
    return rows.map(toMappingEntity);
  }
}
