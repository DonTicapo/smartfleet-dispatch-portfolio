import type { Knex } from 'knex';
import type { Plant } from '../../domain/entities/plant.js';
import type { Mixer } from '../../domain/entities/mixer.js';
import { MixerStatus } from '../../domain/enums/mixer-status.js';
import { EntityNotFoundError, DuplicateEntityError } from '../../domain/errors/domain-error.js';
import type { PlantRepository } from '../../infrastructure/repositories/plant-repository.js';
import type { MixerRepository } from '../../infrastructure/repositories/mixer-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';
import type { GeoLocation } from '../../domain/value-objects/geo-location.js';
import type { MixerType } from '../../domain/enums/mixer-type.js';

export interface CreatePlantInput {
  code: string;
  name: string;
  location?: GeoLocation | null;
  timezone?: string;
}

export interface CreateMixerInput {
  code: string;
  name: string;
  type: MixerType;
  capacityCy: number;
}

export interface UpdateMixerInput {
  name?: string;
  type?: MixerType;
  capacityCy?: number;
}

export class PlantService {
  constructor(
    private db: Knex,
    private plantRepo: PlantRepository,
    private mixerRepo: MixerRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async createPlant(input: CreatePlantInput, actor: string): Promise<Plant> {
    return this.db.transaction(async (trx) => {
      const existing = await this.plantRepo.findByCode(input.code);
      if (existing) {
        throw new DuplicateEntityError('Plant', 'code', input.code);
      }

      const plant = await this.plantRepo.create(
        {
          code: input.code,
          name: input.name,
          location: input.location ?? null,
          timezone: input.timezone ?? 'America/Chicago',
          isActive: true,
        },
        trx,
      );

      await this.auditRepo.log(
        {
          entityType: 'Plant',
          entityId: plant.id,
          action: 'CREATE',
          actor,
          changes: { code: input.code, name: input.name },
        },
        trx,
      );

      return plant;
    });
  }

  async listPlants(activeOnly: boolean = false): Promise<Plant[]> {
    return this.plantRepo.findAll(activeOnly);
  }

  async getPlantById(id: string): Promise<Plant> {
    const plant = await this.plantRepo.findById(id);
    if (!plant) throw new EntityNotFoundError('Plant', id);
    return plant;
  }

  async createMixer(plantId: string, input: CreateMixerInput, actor: string): Promise<Mixer> {
    return this.db.transaction(async (trx) => {
      const plant = await this.plantRepo.findById(plantId);
      if (!plant) throw new EntityNotFoundError('Plant', plantId);

      const existing = await this.mixerRepo.findByPlantAndCode(plantId, input.code);
      if (existing) {
        throw new DuplicateEntityError('Mixer', 'code', `${plantId}/${input.code}`);
      }

      const mixer = await this.mixerRepo.create(
        {
          plantId,
          code: input.code,
          name: input.name,
          type: input.type,
          capacityCy: input.capacityCy,
          status: MixerStatus.IDLE,
          lastStatusAt: new Date(),
        },
        trx,
      );

      await this.auditRepo.log(
        {
          entityType: 'Mixer',
          entityId: mixer.id,
          action: 'CREATE',
          actor,
          changes: { plantId, code: input.code, name: input.name, type: input.type },
        },
        trx,
      );

      return mixer;
    });
  }

  async listMixers(plantId: string): Promise<Mixer[]> {
    const plant = await this.plantRepo.findById(plantId);
    if (!plant) throw new EntityNotFoundError('Plant', plantId);
    return this.mixerRepo.findByPlantId(plantId);
  }

  async updateMixer(plantId: string, mixerId: string, input: UpdateMixerInput, actor: string): Promise<Mixer> {
    return this.db.transaction(async (trx) => {
      const plant = await this.plantRepo.findById(plantId);
      if (!plant) throw new EntityNotFoundError('Plant', plantId);

      const mixer = await this.mixerRepo.findById(mixerId);
      if (!mixer || mixer.plantId !== plantId) {
        throw new EntityNotFoundError('Mixer', mixerId);
      }

      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.type !== undefined) updates.type = input.type;
      if (input.capacityCy !== undefined) updates.capacityCy = input.capacityCy;

      const updated = await this.mixerRepo.update(mixerId, updates, trx);

      await this.auditRepo.log(
        {
          entityType: 'Mixer',
          entityId: mixerId,
          action: 'UPDATE',
          actor,
          changes: updates,
        },
        trx,
      );

      return updated;
    });
  }
}
