import type { Knex } from 'knex';
import type { ScaleReading } from '../../domain/entities/scale-reading.js';
import type { MaterialType } from '../../domain/enums/material-type.js';
import type { WeightUnit } from '../../domain/enums/weight-unit.js';

interface ScaleReadingRow {
  id: string;
  plant_id: string;
  mixer_id: string;
  batch_number: string | null;
  material_type: string;
  target_weight: string;
  actual_weight: string;
  unit: string;
  tolerance: string;
  within_tolerance: boolean;
  recorded_at: Date;
  received_at: Date;
}

function toEntity(row: ScaleReadingRow): ScaleReading {
  return {
    id: row.id,
    plantId: row.plant_id,
    mixerId: row.mixer_id,
    batchNumber: row.batch_number,
    materialType: row.material_type as MaterialType,
    targetWeight: parseFloat(row.target_weight),
    actualWeight: parseFloat(row.actual_weight),
    unit: row.unit as WeightUnit,
    tolerance: parseFloat(row.tolerance),
    withinTolerance: row.within_tolerance,
    recordedAt: row.recorded_at,
    receivedAt: row.received_at,
  };
}

export interface ScaleReadingFilters {
  plantId?: string;
  mixerId?: string;
  batchNumber?: string;
  materialType?: MaterialType;
  withinTolerance?: boolean;
  limit?: number;
  offset?: number;
}

export class ScaleReadingRepository {
  constructor(private db: Knex) {}

  async create(
    data: Omit<ScaleReading, 'id' | 'receivedAt'>,
    trx?: Knex.Transaction,
  ): Promise<ScaleReading> {
    const qb = trx || this.db;
    const [row] = await qb('scale_readings')
      .insert({
        plant_id: data.plantId,
        mixer_id: data.mixerId,
        batch_number: data.batchNumber,
        material_type: data.materialType,
        target_weight: data.targetWeight,
        actual_weight: data.actualWeight,
        unit: data.unit,
        tolerance: data.tolerance,
        within_tolerance: data.withinTolerance,
        recorded_at: data.recordedAt,
      })
      .returning('*');
    return toEntity(row);
  }

  async createMany(
    items: Omit<ScaleReading, 'id' | 'receivedAt'>[],
    trx?: Knex.Transaction,
  ): Promise<ScaleReading[]> {
    const qb = trx || this.db;
    const rows = await qb('scale_readings')
      .insert(
        items.map((data) => ({
          plant_id: data.plantId,
          mixer_id: data.mixerId,
          batch_number: data.batchNumber,
          material_type: data.materialType,
          target_weight: data.targetWeight,
          actual_weight: data.actualWeight,
          unit: data.unit,
          tolerance: data.tolerance,
          within_tolerance: data.withinTolerance,
          recorded_at: data.recordedAt,
        })),
      )
      .returning('*');
    return rows.map(toEntity);
  }

  async findAll(filters: ScaleReadingFilters): Promise<ScaleReading[]> {
    let query = this.db('scale_readings').orderBy('recorded_at', 'desc');

    if (filters.plantId) query = query.where({ plant_id: filters.plantId });
    if (filters.mixerId) query = query.where({ mixer_id: filters.mixerId });
    if (filters.batchNumber) query = query.where({ batch_number: filters.batchNumber });
    if (filters.materialType) query = query.where({ material_type: filters.materialType });
    if (filters.withinTolerance !== undefined) query = query.where({ within_tolerance: filters.withinTolerance });

    const limit = filters.limit ?? 100;
    const offset = filters.offset ?? 0;
    query = query.limit(limit).offset(offset);

    const rows = await query;
    return rows.map(toEntity);
  }
}
