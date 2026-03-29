import type { Knex } from 'knex';
import type { Heartbeat } from '../../domain/entities/heartbeat.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { HeartbeatRepository } from '../../infrastructure/repositories/heartbeat-repository.js';
import type { PlantRepository } from '../../infrastructure/repositories/plant-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export interface RecordHeartbeatInput {
  plantId: string;
  uptimeSeconds: number;
  cpuPercent: number;
  memoryPercent: number;
  diskPercent: number;
  pendingOutbound: number;
  lastCloudSyncAt?: string | Date | null;
}

export class HeartbeatService {
  constructor(
    private db: Knex,
    private heartbeatRepo: HeartbeatRepository,
    private plantRepo: PlantRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async record(input: RecordHeartbeatInput, actor: string): Promise<Heartbeat> {
    return this.db.transaction(async (trx) => {
      const plant = await this.plantRepo.findById(input.plantId);
      if (!plant) throw new EntityNotFoundError('Plant', input.plantId);

      const lastCloudSyncAt = input.lastCloudSyncAt
        ? input.lastCloudSyncAt instanceof Date
          ? input.lastCloudSyncAt
          : new Date(input.lastCloudSyncAt)
        : null;

      const heartbeat = await this.heartbeatRepo.create(
        {
          plantId: input.plantId,
          uptimeSeconds: input.uptimeSeconds,
          cpuPercent: input.cpuPercent,
          memoryPercent: input.memoryPercent,
          diskPercent: input.diskPercent,
          pendingOutbound: input.pendingOutbound,
          lastCloudSyncAt,
          reportedAt: new Date(),
        },
        trx,
      );

      await this.auditRepo.log(
        {
          entityType: 'Heartbeat',
          entityId: heartbeat.id,
          action: 'CREATE',
          actor,
          changes: {
            plantId: input.plantId,
            uptimeSeconds: input.uptimeSeconds,
            cpuPercent: input.cpuPercent,
            memoryPercent: input.memoryPercent,
          },
        },
        trx,
      );

      return heartbeat;
    });
  }

  async getLatest(plantId: string): Promise<Heartbeat> {
    const plant = await this.plantRepo.findById(plantId);
    if (!plant) throw new EntityNotFoundError('Plant', plantId);

    const heartbeat = await this.heartbeatRepo.findLatestByPlantId(plantId);
    if (!heartbeat) throw new EntityNotFoundError('Heartbeat', plantId);
    return heartbeat;
  }
}
