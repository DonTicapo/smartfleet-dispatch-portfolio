import type { DispatchException } from '../../domain/entities/dispatch-exception.js';
import { ExceptionStatus } from '../../domain/enums/exception-status.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import { assertExceptionTransition } from '../../domain/state-machines/exception-lifecycle.js';
import type { ExceptionRepository } from '../../infrastructure/repositories/exception-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export interface CreateExceptionInput {
  loadId?: string | null; assignmentId?: string | null; truckId?: string | null;
  type: string; severity?: string; title: string; description?: string | null;
}

export class ExceptionService {
  constructor(private exceptionRepo: ExceptionRepository, private auditRepo: AuditLogRepository) {}

  async create(input: CreateExceptionInput, actor: string): Promise<DispatchException> {
    const exc = await this.exceptionRepo.create({
      load_id: input.loadId ?? null, assignment_id: input.assignmentId ?? null,
      truck_id: input.truckId ?? null, type: input.type,
      severity: input.severity ?? 'MEDIUM', title: input.title,
      description: input.description ?? null, reported_by: actor,
    });
    await this.auditRepo.log({ entityType: 'DispatchException', entityId: exc.id, action: 'CREATE', actor });
    return exc;
  }

  async getById(id: string): Promise<DispatchException> {
    const exc = await this.exceptionRepo.findById(id);
    if (!exc) throw new EntityNotFoundError('DispatchException', id);
    return exc;
  }

  async list(filters?: { status?: string; type?: string; loadId?: string }): Promise<DispatchException[]> {
    return this.exceptionRepo.findAll(filters);
  }

  async transition(id: string, toStatus: ExceptionStatus, actor: string, resolution?: string): Promise<DispatchException> {
    const exc = await this.getById(id);
    assertExceptionTransition(id, exc.status, toStatus);
    const updates: Record<string, unknown> = { status: toStatus };
    if (toStatus === ExceptionStatus.RESOLVED) {
      updates.resolved_by = actor;
      updates.resolved_at = new Date();
      if (resolution) updates.resolution = resolution;
    }
    const updated = await this.exceptionRepo.update(id, updates);
    await this.auditRepo.log({ entityType: 'DispatchException', entityId: id, action: 'TRANSITION', actor, changes: { from: exc.status, to: toStatus } });
    return updated;
  }
}
