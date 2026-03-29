import type { Knex } from 'knex';
import type { Driver } from '../../domain/entities/driver.js';
import type { DriverStatus } from '../../domain/enums/driver-status.js';

function toEntity(row: Record<string, unknown>): Driver {
  return {
    id: row.id as string, externalId: row.external_id as string | null,
    firstName: row.first_name as string, lastName: row.last_name as string,
    phone: row.phone as string | null, licenseNumber: row.license_number as string | null,
    status: row.status as DriverStatus, defaultTruckId: row.default_truck_id as string | null,
    notes: row.notes as string | null, createdAt: row.created_at as Date, updatedAt: row.updated_at as Date,
  };
}

export class DriverRepository {
  constructor(private db: Knex) {}

  async create(data: Record<string, unknown>): Promise<Driver> {
    const [row] = await this.db('drivers').insert(data).returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<Driver | null> {
    const row = await this.db('drivers').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findAll(status?: string): Promise<Driver[]> {
    const q = this.db('drivers');
    if (status) q.where({ status });
    return (await q.orderBy('last_name')).map(toEntity);
  }

  async update(id: string, data: Record<string, unknown>): Promise<Driver> {
    const [row] = await this.db('drivers').where({ id }).update({ ...data, updated_at: new Date() }).returning('*');
    return toEntity(row);
  }
}
