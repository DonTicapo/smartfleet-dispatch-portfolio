import type { Knex } from 'knex';
import type { DispatchException } from '../../domain/entities/dispatch-exception.js';
import type { ExceptionType } from '../../domain/enums/exception-type.js';
import type { ExceptionSeverity } from '../../domain/enums/exception-severity.js';
import type { ExceptionStatus } from '../../domain/enums/exception-status.js';

function toEntity(row: Record<string, unknown>): DispatchException {
  return {
    id: row.id as string, loadId: row.load_id as string | null,
    assignmentId: row.assignment_id as string | null, truckId: row.truck_id as string | null,
    type: row.type as ExceptionType, severity: row.severity as ExceptionSeverity,
    status: row.status as ExceptionStatus, title: row.title as string,
    description: row.description as string | null, reportedBy: row.reported_by as string,
    resolvedBy: row.resolved_by as string | null, resolvedAt: row.resolved_at as Date | null,
    resolution: row.resolution as string | null, createdAt: row.created_at as Date, updatedAt: row.updated_at as Date,
  };
}

export class ExceptionRepository {
  constructor(private db: Knex) {}

  async create(data: Record<string, unknown>): Promise<DispatchException> {
    const [row] = await this.db('dispatch_exceptions').insert(data).returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<DispatchException | null> {
    const row = await this.db('dispatch_exceptions').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findAll(filters?: { status?: string; type?: string; loadId?: string }): Promise<DispatchException[]> {
    const q = this.db('dispatch_exceptions');
    if (filters?.status) q.where({ status: filters.status });
    if (filters?.type) q.where({ type: filters.type });
    if (filters?.loadId) q.where({ load_id: filters.loadId });
    return (await q.orderBy('created_at', 'desc')).map(toEntity);
  }

  async update(id: string, data: Record<string, unknown>): Promise<DispatchException> {
    const [row] = await this.db('dispatch_exceptions').where({ id }).update({ ...data, updated_at: new Date() }).returning('*');
    return toEntity(row);
  }
}
