import type { Knex } from 'knex';
import type { KpiDefinition } from '../../domain/entities/kpi-definition.js';
import type { KpiDimension } from '../../domain/enums/kpi-dimension.js';

interface KpiDefinitionRow {
  id: string;
  name: string;
  display_name: string;
  description: string;
  unit: string;
  dimension: string;
  formula: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: KpiDefinitionRow): KpiDefinition {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    unit: row.unit,
    dimension: row.dimension as KpiDimension,
    formula: row.formula,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class KpiDefinitionRepository {
  constructor(private db: Knex) {}

  async create(
    data: Omit<KpiDefinition, 'id' | 'createdAt' | 'updatedAt'>,
    trx?: Knex.Transaction,
  ): Promise<KpiDefinition> {
    const qb = trx || this.db;
    const [row] = await qb('kpi_definitions')
      .insert({
        name: data.name,
        display_name: data.displayName,
        description: data.description,
        unit: data.unit,
        dimension: data.dimension,
        formula: data.formula,
        is_active: data.isActive,
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<KpiDefinition | null> {
    const row = await this.db('kpi_definitions').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findByName(name: string): Promise<KpiDefinition | null> {
    const row = await this.db('kpi_definitions').where({ name }).first();
    return row ? toEntity(row) : null;
  }

  async listActive(): Promise<KpiDefinition[]> {
    const rows = await this.db('kpi_definitions')
      .where({ is_active: true })
      .orderBy('name');
    return rows.map(toEntity);
  }

  async listAll(): Promise<KpiDefinition[]> {
    const rows = await this.db('kpi_definitions').orderBy('name');
    return rows.map(toEntity);
  }
}
