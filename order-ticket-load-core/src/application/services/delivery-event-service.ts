import type { Knex } from 'knex';
import type { DeliveryStateEvent } from '../../domain/entities/delivery-state-event.js';
import type { DeliveryState } from '../../domain/enums/delivery-state.js';
import { canTransition, getLoadStatusForDeliveryState } from '../../domain/state-machines/load-lifecycle.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { DeliveryEventRepository } from '../../infrastructure/repositories/delivery-event-repository.js';
import type { LoadRepository } from '../../infrastructure/repositories/load-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export interface RecordDeliveryEventInput {
  eventId: string;
  loadId: string;
  state: DeliveryState;
  occurredAt: Date;
  source: string;
  sourceEventId?: string | null;
  payload?: Record<string, unknown> | null;
}

export interface RecordResult {
  event: DeliveryStateEvent;
  isNew: boolean;
  loadStatusChanged: boolean;
}

const DELIVERY_STATE_TIMESTAMP_MAP: Record<string, string> = {
  PLANT_DEPARTED: 'departed_plant_at',
  ON_SITE_ARRIVED: 'arrived_site_at',
  POUR_STARTED: 'pour_started_at',
  POUR_COMPLETED: 'pour_completed_at',
  PLANT_RETURNED: 'returned_plant_at',
};

export class DeliveryEventService {
  constructor(
    private db: Knex,
    private eventRepo: DeliveryEventRepository,
    private loadRepo: LoadRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async record(input: RecordDeliveryEventInput, actor: string): Promise<RecordResult> {
    return this.db.transaction(async (trx) => {
      // 1. Verify load exists
      const load = await this.loadRepo.findById(input.loadId);
      if (!load) throw new EntityNotFoundError('Load', input.loadId);

      // 2. Insert event idempotently
      const { event, isNew } = await this.eventRepo.insertIdempotent(
        {
          eventId: input.eventId,
          loadId: input.loadId,
          state: input.state,
          occurredAt: input.occurredAt,
          source: input.source,
          sourceEventId: input.sourceEventId ?? null,
          payload: input.payload ?? null,
        },
        trx,
      );

      if (!isNew) {
        return { event, isNew: false, loadStatusChanged: false };
      }

      // 3. Check if this delivery state drives a load status change
      const targetStatus = getLoadStatusForDeliveryState(input.state);
      let loadStatusChanged = false;

      if (targetStatus && canTransition(load.status, targetStatus)) {
        const timestampCol = DELIVERY_STATE_TIMESTAMP_MAP[input.state];
        const updates: Record<string, unknown> = {
          status: targetStatus,
        };
        if (timestampCol) {
          updates[timestampCol] = input.occurredAt;
        }

        await this.loadRepo.update(load.id, updates, trx);
        loadStatusChanged = true;

        await this.auditRepo.log(
          {
            entityType: 'Load',
            entityId: load.id,
            action: 'STATUS_CHANGE',
            actor,
            changes: { from: load.status, to: targetStatus, triggeredBy: input.eventId },
          },
          trx,
        );
      } else if (targetStatus && !canTransition(load.status, targetStatus)) {
        // Event recorded but transition invalid — log warning, don't fail
        await this.auditRepo.log(
          {
            entityType: 'Load',
            entityId: load.id,
            action: 'INVALID_TRANSITION_SKIPPED',
            actor,
            changes: {
              from: load.status,
              attemptedTo: targetStatus,
              eventId: input.eventId,
            },
          },
          trx,
        );
      }

      // 4. Audit the event recording itself
      await this.auditRepo.log(
        {
          entityType: 'DeliveryStateEvent',
          entityId: event.id,
          action: 'RECORD',
          actor,
        },
        trx,
      );

      return { event, isNew: true, loadStatusChanged };
    });
  }
}
