import type { Knex } from 'knex';
import type { IngestEvent } from '../../domain/entities/ingest-event.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { IngestEventRepository, IngestEventFilters } from '../../infrastructure/repositories/ingest-event-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export class EventQueryService {
  constructor(
    private db: Knex,
    private eventRepo: IngestEventRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async getByEventId(eventId: string): Promise<IngestEvent> {
    const event = await this.eventRepo.findByEventId(eventId);
    if (!event) throw new EntityNotFoundError('IngestEvent', eventId);
    return event;
  }

  async query(filters: IngestEventFilters): Promise<IngestEvent[]> {
    return this.eventRepo.query(filters);
  }

  async replay(eventId: string, actor: string): Promise<IngestEvent> {
    return this.db.transaction(async (trx) => {
      const event = await this.eventRepo.markForReprocessing(eventId, trx);
      if (!event) throw new EntityNotFoundError('IngestEvent', eventId);

      await this.auditRepo.log(
        {
          entityType: 'IngestEvent',
          entityId: event.id,
          action: 'REPLAY',
          actor,
          changes: { eventId },
        },
        trx,
      );

      return event;
    });
  }
}
