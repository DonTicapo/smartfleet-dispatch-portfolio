import type { Knex } from 'knex';

export interface AuditEntry {
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  changes?: Record<string, unknown>;
  requestId?: string;
}

export class AuditLogRepository {
  constructor(private db: Knex) {}

  async log(entry: AuditEntry, trx?: Knex.Transaction): Promise<void> {
    const qb = trx || this.db;
    await qb('audit_log').insert({
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      action: entry.action,
      actor: entry.actor,
      changes: entry.changes ? JSON.stringify(entry.changes) : null,
      request_id: entry.requestId ?? null,
    });
  }
}
