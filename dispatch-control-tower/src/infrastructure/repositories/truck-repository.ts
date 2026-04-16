import type { Knex } from 'knex';
import type { Truck } from '../../domain/entities/truck.js';
import type { TruckStatus } from '../../domain/enums/truck-status.js';

function toEntity(row: Record<string, unknown>): Truck {
  return {
    id: row.id as string, externalId: row.external_id as string | null, number: row.number as string,
    licensePlate: row.license_plate as string | null, capacityAmount: row.capacity_amount ? parseFloat(row.capacity_amount as string) : null,
    capacityUnit: (row.capacity_unit as string) || 'M3', status: row.status as TruckStatus,
    homePlantId: row.home_plant_id as string | null, notes: row.notes as string | null,
    createdAt: row.created_at as Date, updatedAt: row.updated_at as Date,
  };
}

export class TruckRepository {
  constructor(private db: Knex) {}

  async create(data: Record<string, unknown>): Promise<Truck> {
    const [row] = await this.db('trucks').insert(data).returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<Truck | null> {
    const row = await this.db('trucks').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findAll(status?: string): Promise<Truck[]> {
    const q = this.db('trucks');
    if (status) q.where({ status });
    return (await q.orderBy('number')).map(toEntity);
  }

  async update(id: string, data: Record<string, unknown>): Promise<Truck> {
    const [row] = await this.db('trucks').where({ id }).update({ ...data, updated_at: new Date() }).returning('*');
    return toEntity(row);
  }
}
