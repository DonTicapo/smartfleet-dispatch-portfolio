import type { Knex } from 'knex';
import type { Load } from '../../domain/entities/load.js';
import type { LoadStatus } from '../../domain/enums/load-status.js';
import type { UnitOfMeasure } from '../../domain/enums/unit-of-measure.js';

interface LoadRow {
  id: string;
  ticket_id: string;
  load_number: number;
  truck_id: string | null;
  driver_id: string | null;
  mix_design_id: string;
  actual_quantity_amount: string | null;
  actual_quantity_unit: string | null;
  status: string;
  batched_at: Date | null;
  departed_plant_at: Date | null;
  arrived_site_at: Date | null;
  pour_started_at: Date | null;
  pour_completed_at: Date | null;
  returned_plant_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: LoadRow): Load {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    loadNumber: row.load_number,
    truckId: row.truck_id,
    driverId: row.driver_id,
    mixDesignId: row.mix_design_id,
    actualQuantity:
      row.actual_quantity_amount != null
        ? { amount: parseFloat(row.actual_quantity_amount), unit: row.actual_quantity_unit as UnitOfMeasure }
        : null,
    status: row.status as LoadStatus,
    batchedAt: row.batched_at,
    departedPlantAt: row.departed_plant_at,
    arrivedSiteAt: row.arrived_site_at,
    pourStartedAt: row.pour_started_at,
    pourCompletedAt: row.pour_completed_at,
    returnedPlantAt: row.returned_plant_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class LoadRepository {
  constructor(private db: Knex) {}

  async create(
    data: Omit<Load, 'id' | 'createdAt' | 'updatedAt'>,
    trx?: Knex.Transaction,
  ): Promise<Load> {
    const qb = trx || this.db;
    const nextNumber = await this.getNextLoadNumber(data.ticketId, qb);
    const [row] = await qb('loads')
      .insert({
        ticket_id: data.ticketId,
        load_number: nextNumber,
        truck_id: data.truckId,
        driver_id: data.driverId,
        mix_design_id: data.mixDesignId,
        actual_quantity_amount: data.actualQuantity?.amount ?? null,
        actual_quantity_unit: data.actualQuantity?.unit ?? 'M3',
        status: data.status,
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<Load | null> {
    const row = await this.db('loads').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findByTicketId(ticketId: string): Promise<Load[]> {
    const rows = await this.db('loads').where({ ticket_id: ticketId }).orderBy('load_number');
    return rows.map(toEntity);
  }

  async update(id: string, updates: Partial<LoadRow>, trx?: Knex.Transaction): Promise<Load> {
    const qb = trx || this.db;
    const [row] = await qb('loads')
      .where({ id })
      .update({ ...updates, updated_at: new Date() })
      .returning('*');
    return toEntity(row);
  }

  private async getNextLoadNumber(ticketId: string, qb: Knex | Knex.Transaction): Promise<number> {
    const result = await qb('loads').where({ ticket_id: ticketId }).max('load_number as max');
    return (result[0]?.max ?? 0) + 1;
  }
}
