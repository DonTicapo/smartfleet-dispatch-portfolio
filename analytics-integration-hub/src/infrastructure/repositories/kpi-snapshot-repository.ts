import type { Knex } from 'knex';
import type { KpiSnapshot } from '../../domain/entities/kpi-snapshot.js';
import type { KpiDimension } from '../../domain/enums/kpi-dimension.js';

interface KpiSnapshotRow {
  id: string;
  kpi_name: string;
  dimension: string;
  dimension_id: string;
  value: string;
  unit: string;
  period_start: Date;
  period_end: Date;
  computed_at: Date;
  created_at: Date;
}

function toEntity(row: KpiSnapshotRow): KpiSnapshot {
  return {
    id: row.id,
    kpiName: row.kpi_name,
    dimension: row.dimension as KpiDimension,
    dimensionId: row.dimension_id,
    value: parseFloat(row.value),
    unit: row.unit,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    computedAt: row.computed_at,
    createdAt: row.created_at,
  };
}

export interface KpiSnapshotFilters {
  kpiName?: string;
  dimension?: KpiDimension;
  dimensionId?: string;
  periodStart?: Date;
  periodEnd?: Date;
  limit?: number;
  offset?: number;
}

export class KpiSnapshotRepository {
  constructor(private db: Knex) {}

  async create(
    data: Omit<KpiSnapshot, 'id' | 'createdAt'>,
    trx?: Knex.Transaction,
  ): Promise<KpiSnapshot> {
    const qb = trx || this.db;
    const [row] = await qb('kpi_snapshots')
      .insert({
        kpi_name: data.kpiName,
        dimension: data.dimension,
        dimension_id: data.dimensionId,
        value: data.value,
        unit: data.unit,
        period_start: data.periodStart,
        period_end: data.periodEnd,
        computed_at: data.computedAt,
      })
      .returning('*');
    return toEntity(row);
  }

  async createMany(
    snapshots: Omit<KpiSnapshot, 'id' | 'createdAt'>[],
    trx?: Knex.Transaction,
  ): Promise<KpiSnapshot[]> {
    if (snapshots.length === 0) return [];
    const qb = trx || this.db;
    const rows = await qb('kpi_snapshots')
      .insert(
        snapshots.map((s) => ({
          kpi_name: s.kpiName,
          dimension: s.dimension,
          dimension_id: s.dimensionId,
          value: s.value,
          unit: s.unit,
          period_start: s.periodStart,
          period_end: s.periodEnd,
          computed_at: s.computedAt,
        })),
      )
      .returning('*');
    return rows.map(toEntity);
  }

  async query(filters: KpiSnapshotFilters): Promise<KpiSnapshot[]> {
    let qb = this.db('kpi_snapshots');

    if (filters.kpiName) qb = qb.where('kpi_name', filters.kpiName);
    if (filters.dimension) qb = qb.where('dimension', filters.dimension);
    if (filters.dimensionId) qb = qb.where('dimension_id', filters.dimensionId);
    if (filters.periodStart) qb = qb.where('period_start', '>=', filters.periodStart);
    if (filters.periodEnd) qb = qb.where('period_end', '<=', filters.periodEnd);

    qb = qb.orderBy('period_start', 'desc');
    if (filters.limit) qb = qb.limit(filters.limit);
    if (filters.offset) qb = qb.offset(filters.offset);

    const rows = await qb;
    return rows.map(toEntity);
  }

  async queryByDimension(
    dimension: KpiDimension,
    dimensionId?: string,
  ): Promise<KpiSnapshot[]> {
    let qb = this.db('kpi_snapshots').where('dimension', dimension);
    if (dimensionId) qb = qb.where('dimension_id', dimensionId);
    qb = qb.orderBy('period_start', 'desc');
    const rows = await qb;
    return rows.map(toEntity);
  }
}
