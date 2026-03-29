import type { Knex } from 'knex';
import type { Load } from '../../domain/entities/load.js';
import { LoadStatus } from '../../domain/enums/load-status.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { LoadRepository } from '../../infrastructure/repositories/load-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';
import type { Quantity } from '../../domain/value-objects/quantity.js';

export interface CreateLoadInput {
  ticketId: string;
  truckId?: string | null;
  driverId?: string | null;
  mixDesignId: string;
  actualQuantity?: Quantity | null;
}

export class LoadService {
  constructor(
    private db: Knex,
    private loadRepo: LoadRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async create(input: CreateLoadInput, actor: string): Promise<Load> {
    return this.db.transaction(async (trx) => {
      const load = await this.loadRepo.create(
        {
          ticketId: input.ticketId,
          loadNumber: 0, // auto-assigned by repository
          truckId: input.truckId ?? null,
          driverId: input.driverId ?? null,
          mixDesignId: input.mixDesignId,
          actualQuantity: input.actualQuantity ?? null,
          status: LoadStatus.SCHEDULED,
          batchedAt: null,
          departedPlantAt: null,
          arrivedSiteAt: null,
          pourStartedAt: null,
          pourCompletedAt: null,
          returnedPlantAt: null,
        },
        trx,
      );

      await this.auditRepo.log(
        {
          entityType: 'Load',
          entityId: load.id,
          action: 'CREATE',
          actor,
        },
        trx,
      );

      return load;
    });
  }

  async getById(id: string): Promise<Load> {
    const load = await this.loadRepo.findById(id);
    if (!load) throw new EntityNotFoundError('Load', id);
    return load;
  }
}
