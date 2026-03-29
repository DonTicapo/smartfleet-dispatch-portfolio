import type { Knex } from 'knex';
import type { BatchEvent } from '../../domain/entities/batch-event.js';
import type { BatchEventType } from '../../domain/enums/batch-event-type.js';
import { OutboundStatus } from '../../domain/enums/outbound-status.js';
import { OutboundTarget } from '../../domain/enums/outbound-target.js';
import { EntityNotFoundError, ValidationError } from '../../domain/errors/domain-error.js';
import type { BatchEventRepository, BatchEventFilters } from '../../infrastructure/repositories/batch-event-repository.js';
import type { PlantRepository } from '../../infrastructure/repositories/plant-repository.js';
import type { MixerRepository } from '../../infrastructure/repositories/mixer-repository.js';
import type { OutboundEventRepository } from '../../infrastructure/repositories/outbound-event-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export interface RecordBatchEventInput {
  eventId: string;
  plantId: string;
  mixerId: string;
  ticketNumber?: string | null;
  batchNumber: string;
  eventType: BatchEventType;
  payload?: Record<string, unknown>;
  occurredAt: string | Date;
}

export class BatchEventService {
  constructor(
    private db: Knex,
    private batchEventRepo: BatchEventRepository,
    private plantRepo: PlantRepository,
    private mixerRepo: MixerRepository,
    private outboundRepo: OutboundEventRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async record(input: RecordBatchEventInput, actor: string): Promise<{ event: BatchEvent; created: boolean }> {
    return this.db.transaction(async (trx) => {
      // Validate plant exists
      const plant = await this.plantRepo.findById(input.plantId);
      if (!plant) throw new EntityNotFoundError('Plant', input.plantId);

      // Validate mixer exists and belongs to plant
      const mixer = await this.mixerRepo.findById(input.mixerId);
      if (!mixer || mixer.plantId !== input.plantId) {
        throw new ValidationError(`Mixer '${input.mixerId}' not found at plant '${input.plantId}'`);
      }

      const occurredAt = input.occurredAt instanceof Date ? input.occurredAt : new Date(input.occurredAt);

      // Idempotent upsert by eventId
      const { event, created } = await this.batchEventRepo.upsertByEventId(
        {
          eventId: input.eventId,
          plantId: input.plantId,
          mixerId: input.mixerId,
          ticketNumber: input.ticketNumber ?? null,
          batchNumber: input.batchNumber,
          eventType: input.eventType,
          payload: input.payload ?? {},
          occurredAt,
        },
        trx,
      );

      if (created) {
        // Create outbound event to sync with OTL Core
        await this.outboundRepo.create(
          {
            eventType: 'BATCH_EVENT',
            payload: {
              eventId: event.eventId,
              plantId: event.plantId,
              mixerId: event.mixerId,
              plantCode: plant.code,
              ticketNumber: event.ticketNumber,
              batchNumber: event.batchNumber,
              eventType: event.eventType,
              payload: event.payload,
              occurredAt: event.occurredAt.toISOString(),
            },
            targetService: OutboundTarget.OTL_CORE,
            status: OutboundStatus.PENDING,
            attempts: 0,
            maxAttempts: 5,
            lastAttemptAt: null,
            nextRetryAt: null,
            sentAt: null,
          },
          trx,
        );

        await this.auditRepo.log(
          {
            entityType: 'BatchEvent',
            entityId: event.id,
            action: 'CREATE',
            actor,
            changes: {
              eventId: event.eventId,
              eventType: event.eventType,
              batchNumber: event.batchNumber,
            },
          },
          trx,
        );
      }

      return { event, created };
    });
  }

  async getByEventId(eventId: string): Promise<BatchEvent> {
    const event = await this.batchEventRepo.findByEventId(eventId);
    if (!event) throw new EntityNotFoundError('BatchEvent', eventId);
    return event;
  }

  async query(filters: BatchEventFilters): Promise<BatchEvent[]> {
    return this.batchEventRepo.findAll(filters);
  }
}
