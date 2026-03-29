import type { Knex } from 'knex';
import type { Plant } from '../../domain/entities/plant.js';
import type { GeoLocation } from '../../domain/value-objects/geo-location.js';

interface PlantRow {
  id: string;
  code: string;
  name: string;
  location: GeoLocation | null;
  timezone: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: PlantRow): Plant {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    location: row.location,
    timezone: row.timezone,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PlantRepository {
  constructor(private db: Knex) {}

  async create(
    data: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>,
    trx?: Knex.Transaction,
  ): Promise<Plant> {
    const qb = trx || this.db;
    const [row] = await qb('plants')
      .insert({
        code: data.code,
        name: data.name,
        location: data.location ? JSON.stringify(data.location) : null,
        timezone: data.timezone,
        is_active: data.isActive,
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<Plant | null> {
    const row = await this.db('plants').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findByCode(code: string): Promise<Plant | null> {
    const row = await this.db('plants').where({ code }).first();
    return row ? toEntity(row) : null;
  }

  async findAll(activeOnly: boolean = false): Promise<Plant[]> {
    let query = this.db('plants').orderBy('name');
    if (activeOnly) {
      query = query.where({ is_active: true });
    }
    const rows = await query;
    return rows.map(toEntity);
  }

  async update(id: string, updates: Partial<Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>>, trx?: Knex.Transaction): Promise<Plant> {
    const qb = trx || this.db;
    const mapped: Record<string, unknown> = { updated_at: new Date() };
    if (updates.code !== undefined) mapped.code = updates.code;
    if (updates.name !== undefined) mapped.name = updates.name;
    if (updates.location !== undefined) mapped.location = updates.location ? JSON.stringify(updates.location) : null;
    if (updates.timezone !== undefined) mapped.timezone = updates.timezone;
    if (updates.isActive !== undefined) mapped.is_active = updates.isActive;

    const [row] = await qb('plants').where({ id }).update(mapped).returning('*');
    return toEntity(row);
  }
}
