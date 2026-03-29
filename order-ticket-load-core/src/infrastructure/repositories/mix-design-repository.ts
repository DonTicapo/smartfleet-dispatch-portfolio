import type { Knex } from 'knex';
import type { MixDesign } from '../../domain/entities/mix-design.js';

interface MixDesignRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  strength_psi: number | null;
  slump_inches: string | null;
  version: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: MixDesignRow): MixDesign {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    strengthPsi: row.strength_psi,
    slumpInches: row.slump_inches ? parseFloat(row.slump_inches) : null,
    version: row.version,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class MixDesignRepository {
  constructor(private db: Knex) {}

  async create(data: Omit<MixDesign, 'id' | 'createdAt' | 'updatedAt'>): Promise<MixDesign> {
    const [row] = await this.db('mix_designs')
      .insert({
        code: data.code,
        name: data.name,
        description: data.description,
        strength_psi: data.strengthPsi,
        slump_inches: data.slumpInches,
        version: data.version,
        is_active: data.isActive,
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<MixDesign | null> {
    const row = await this.db('mix_designs').where({ id }).first();
    return row ? toEntity(row) : null;
  }
}
