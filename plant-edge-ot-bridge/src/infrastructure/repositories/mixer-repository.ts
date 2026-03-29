import type { Knex } from 'knex';
import type { Mixer } from '../../domain/entities/mixer.js';
import type { MixerType } from '../../domain/enums/mixer-type.js';
import type { MixerStatus } from '../../domain/enums/mixer-status.js';

interface MixerRow {
  id: string;
  plant_id: string;
  code: string;
  name: string;
  type: string;
  capacity_cy: string;
  status: string;
  last_status_at: Date;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: MixerRow): Mixer {
  return {
    id: row.id,
    plantId: row.plant_id,
    code: row.code,
    name: row.name,
    type: row.type as MixerType,
    capacityCy: parseFloat(row.capacity_cy),
    status: row.status as MixerStatus,
    lastStatusAt: row.last_status_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class MixerRepository {
  constructor(private db: Knex) {}

  async create(
    data: Omit<Mixer, 'id' | 'createdAt' | 'updatedAt'>,
    trx?: Knex.Transaction,
  ): Promise<Mixer> {
    const qb = trx || this.db;
    const [row] = await qb('mixers')
      .insert({
        plant_id: data.plantId,
        code: data.code,
        name: data.name,
        type: data.type,
        capacity_cy: data.capacityCy,
        status: data.status,
        last_status_at: data.lastStatusAt,
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<Mixer | null> {
    const row = await this.db('mixers').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findByPlantId(plantId: string): Promise<Mixer[]> {
    const rows = await this.db('mixers').where({ plant_id: plantId }).orderBy('code');
    return rows.map(toEntity);
  }

  async findByPlantAndCode(plantId: string, code: string): Promise<Mixer | null> {
    const row = await this.db('mixers').where({ plant_id: plantId, code }).first();
    return row ? toEntity(row) : null;
  }

  async update(
    id: string,
    updates: Partial<{ name: string; type: MixerType; capacityCy: number; status: MixerStatus; lastStatusAt: Date }>,
    trx?: Knex.Transaction,
  ): Promise<Mixer> {
    const qb = trx || this.db;
    const mapped: Record<string, unknown> = { updated_at: new Date() };
    if (updates.name !== undefined) mapped.name = updates.name;
    if (updates.type !== undefined) mapped.type = updates.type;
    if (updates.capacityCy !== undefined) mapped.capacity_cy = updates.capacityCy;
    if (updates.status !== undefined) mapped.status = updates.status;
    if (updates.lastStatusAt !== undefined) mapped.last_status_at = updates.lastStatusAt;

    const [row] = await qb('mixers').where({ id }).update(mapped).returning('*');
    return toEntity(row);
  }
}
