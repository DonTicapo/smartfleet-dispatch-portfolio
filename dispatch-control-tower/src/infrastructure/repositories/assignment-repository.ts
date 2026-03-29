import type { Knex } from 'knex';
import type { Assignment } from '../../domain/entities/assignment.js';
import type { AssignmentStatus } from '../../domain/enums/assignment-status.js';

function toEntity(row: Record<string, unknown>): Assignment {
  return {
    id: row.id as string, loadId: row.load_id as string,
    truckId: row.truck_id as string, driverId: row.driver_id as string,
    status: row.status as AssignmentStatus, assignedBy: row.assigned_by as string,
    assignedAt: row.assigned_at as Date, confirmedAt: row.confirmed_at as Date | null,
    completedAt: row.completed_at as Date | null, cancelledAt: row.cancelled_at as Date | null,
    cancellationReason: row.cancellation_reason as string | null, notes: row.notes as string | null,
    createdAt: row.created_at as Date, updatedAt: row.updated_at as Date,
  };
}

export class AssignmentRepository {
  constructor(private db: Knex) {}

  async create(data: Record<string, unknown>, trx?: Knex.Transaction): Promise<Assignment> {
    const qb = trx || this.db;
    const [row] = await qb('assignments').insert(data).returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<Assignment | null> {
    const row = await this.db('assignments').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findActiveByLoadId(loadId: string): Promise<Assignment | null> {
    const row = await this.db('assignments')
      .where({ load_id: loadId })
      .whereNotIn('status', ['CANCELLED', 'COMPLETED'])
      .first();
    return row ? toEntity(row) : null;
  }

  async update(id: string, data: Record<string, unknown>, trx?: Knex.Transaction): Promise<Assignment> {
    const qb = trx || this.db;
    const [row] = await qb('assignments').where({ id }).update({ ...data, updated_at: new Date() }).returning('*');
    return toEntity(row);
  }
}
