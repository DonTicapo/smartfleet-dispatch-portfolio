import type { Knex } from 'knex';
import type { Assignment } from '../../domain/entities/assignment.js';
import { AssignmentStatus } from '../../domain/enums/assignment-status.js';
import { TruckStatus } from '../../domain/enums/truck-status.js';
import { DriverStatus } from '../../domain/enums/driver-status.js';
import { EntityNotFoundError, ValidationError } from '../../domain/errors/domain-error.js';
import { assertAssignmentTransition } from '../../domain/state-machines/assignment-lifecycle.js';
import type { AssignmentRepository } from '../../infrastructure/repositories/assignment-repository.js';
import type { TruckRepository } from '../../infrastructure/repositories/truck-repository.js';
import type { DriverRepository } from '../../infrastructure/repositories/driver-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';
import type { OtlCoreClient } from '../../infrastructure/otl-core/otl-core-client.js';

export interface CreateAssignmentInput {
  loadId: string;
  truckId: string;
  driverId: string;
  notes?: string | null;
}

export class AssignmentService {
  constructor(
    private db: Knex,
    private assignmentRepo: AssignmentRepository,
    private truckRepo: TruckRepository,
    private driverRepo: DriverRepository,
    private auditRepo: AuditLogRepository,
    private otlCoreClient: OtlCoreClient,
  ) {}

  async create(input: CreateAssignmentInput, actor: string): Promise<Assignment> {
    return this.db.transaction(async (trx) => {
      const truck = await this.truckRepo.findById(input.truckId);
      if (!truck) throw new EntityNotFoundError('Truck', input.truckId);
      if (truck.status !== TruckStatus.AVAILABLE) throw new ValidationError(`Truck ${truck.number} is not available (status: ${truck.status})`);

      const driver = await this.driverRepo.findById(input.driverId);
      if (!driver) throw new EntityNotFoundError('Driver', input.driverId);
      if (driver.status !== DriverStatus.AVAILABLE) throw new ValidationError(`Driver ${driver.firstName} ${driver.lastName} is not available (status: ${driver.status})`);

      const existing = await this.assignmentRepo.findActiveByLoadId(input.loadId);
      if (existing) throw new ValidationError(`Load ${input.loadId} already has an active assignment`);

      const assignment = await this.assignmentRepo.create({
        load_id: input.loadId, truck_id: input.truckId, driver_id: input.driverId,
        status: AssignmentStatus.PENDING, assigned_by: actor, notes: input.notes ?? null,
      }, trx);

      // Write back to OTL core
      try {
        await this.otlCoreClient.updateLoadAssignment(input.loadId, truck.number, `${driver.firstName} ${driver.lastName}`);
        await this.assignmentRepo.update(assignment.id, { status: AssignmentStatus.CONFIRMED, confirmed_at: new Date() }, trx);
        assignment.status = AssignmentStatus.CONFIRMED;
      } catch {
        // OTL core unavailable — assignment stays PENDING for retry
      }

      await this.truckRepo.update(input.truckId, { status: TruckStatus.ASSIGNED });
      await this.driverRepo.update(input.driverId, { status: DriverStatus.ASSIGNED });

      await this.auditRepo.log({ entityType: 'Assignment', entityId: assignment.id, action: 'CREATE', actor, changes: { loadId: input.loadId, truckId: input.truckId, driverId: input.driverId } }, trx);
      return assignment;
    });
  }

  async getById(id: string): Promise<Assignment> {
    const a = await this.assignmentRepo.findById(id);
    if (!a) throw new EntityNotFoundError('Assignment', id);
    return a;
  }

  async cancel(id: string, reason: string, actor: string): Promise<Assignment> {
    const a = await this.getById(id);
    assertAssignmentTransition(id, a.status, AssignmentStatus.CANCELLED);
    const updated = await this.assignmentRepo.update(id, { status: AssignmentStatus.CANCELLED, cancelled_at: new Date(), cancellation_reason: reason });
    await this.truckRepo.update(a.truckId, { status: TruckStatus.AVAILABLE });
    await this.driverRepo.update(a.driverId, { status: DriverStatus.AVAILABLE });
    await this.auditRepo.log({ entityType: 'Assignment', entityId: id, action: 'CANCEL', actor, changes: { reason } });
    return updated;
  }
}
