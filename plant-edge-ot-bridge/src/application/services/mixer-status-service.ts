import type { Knex } from 'knex';
import type { MixerStatusLog } from '../../domain/entities/mixer-status-log.js';
import type { Mixer } from '../../domain/entities/mixer.js';
import { MixerStatus } from '../../domain/enums/mixer-status.js';
import { OutboundStatus } from '../../domain/enums/outbound-status.js';
import { OutboundTarget } from '../../domain/enums/outbound-target.js';
import { EntityNotFoundError, ValidationError } from '../../domain/errors/domain-error.js';
import { canTransition, isFaultStatus } from '../../domain/state-machines/mixer-state-machine.js';
import { InvalidTransitionError } from '../../domain/errors/domain-error.js';
import type { MixerRepository } from '../../infrastructure/repositories/mixer-repository.js';
import type { MixerStatusLogRepository } from '../../infrastructure/repositories/mixer-status-log-repository.js';
import type { PlantRepository } from '../../infrastructure/repositories/plant-repository.js';
import type { OutboundEventRepository } from '../../infrastructure/repositories/outbound-event-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export interface RecordMixerStatusInput {
  plantId: string;
  mixerId: string;
  status: MixerStatus;
  reason?: string | null;
  operatorId?: string | null;
  occurredAt: string | Date;
}

export class MixerStatusService {
  constructor(
    private db: Knex,
    private mixerRepo: MixerRepository,
    private statusLogRepo: MixerStatusLogRepository,
    private plantRepo: PlantRepository,
    private outboundRepo: OutboundEventRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async recordStatusChange(input: RecordMixerStatusInput, actor: string): Promise<MixerStatusLog> {
    return this.db.transaction(async (trx) => {
      // Validate plant exists
      const plant = await this.plantRepo.findById(input.plantId);
      if (!plant) throw new EntityNotFoundError('Plant', input.plantId);

      // Validate mixer exists and belongs to plant
      const mixer = await this.mixerRepo.findById(input.mixerId);
      if (!mixer || mixer.plantId !== input.plantId) {
        throw new ValidationError(`Mixer '${input.mixerId}' not found at plant '${input.plantId}'`);
      }

      const newStatus = input.status;
      const previousStatus = mixer.status;

      // Validate state transition
      if (!canTransition(previousStatus, newStatus)) {
        throw new InvalidTransitionError('Mixer', mixer.id, previousStatus, newStatus);
      }

      const occurredAt = input.occurredAt instanceof Date ? input.occurredAt : new Date(input.occurredAt);

      // Update mixer status
      await this.mixerRepo.update(
        mixer.id,
        { status: newStatus, lastStatusAt: occurredAt },
        trx,
      );

      // Create status log entry
      const logEntry = await this.statusLogRepo.create(
        {
          plantId: input.plantId,
          mixerId: input.mixerId,
          previousStatus,
          currentStatus: newStatus,
          reason: input.reason ?? null,
          operatorId: input.operatorId ?? null,
          occurredAt,
        },
        trx,
      );

      // If entering FAULT state, create outbound event
      if (isFaultStatus(newStatus)) {
        await this.outboundRepo.create(
          {
            eventType: 'MIXER_FAULT',
            payload: {
              plantId: input.plantId,
              plantCode: plant.code,
              mixerId: input.mixerId,
              mixerCode: mixer.code,
              previousStatus,
              currentStatus: newStatus,
              reason: input.reason ?? null,
              operatorId: input.operatorId ?? null,
              occurredAt: occurredAt.toISOString(),
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
      }

      await this.auditRepo.log(
        {
          entityType: 'MixerStatusLog',
          entityId: logEntry.id,
          action: 'CREATE',
          actor,
          changes: {
            mixerId: input.mixerId,
            previousStatus,
            currentStatus: newStatus,
            reason: input.reason ?? null,
          },
        },
        trx,
      );

      return logEntry;
    });
  }

  async getCurrentStatus(mixerId: string): Promise<Mixer> {
    const mixer = await this.mixerRepo.findById(mixerId);
    if (!mixer) throw new EntityNotFoundError('Mixer', mixerId);
    return mixer;
  }

  async getStatusHistory(
    mixerId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<MixerStatusLog[]> {
    const mixer = await this.mixerRepo.findById(mixerId);
    if (!mixer) throw new EntityNotFoundError('Mixer', mixerId);
    return this.statusLogRepo.findByMixerId(mixerId, options);
  }
}
