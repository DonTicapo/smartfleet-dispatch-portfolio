import type { Driver } from '../../domain/entities/driver.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { DriverRepository } from '../../infrastructure/repositories/driver-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export class DriverService {
  constructor(private driverRepo: DriverRepository, private auditRepo: AuditLogRepository) {}

  async create(data: { firstName: string; lastName: string; externalId?: string | null; phone?: string | null; licenseNumber?: string | null; defaultTruckId?: string | null; notes?: string | null }, actor: string): Promise<Driver> {
    const driver = await this.driverRepo.create({
      first_name: data.firstName, last_name: data.lastName, external_id: data.externalId ?? null,
      phone: data.phone ?? null, license_number: data.licenseNumber ?? null,
      default_truck_id: data.defaultTruckId ?? null, notes: data.notes ?? null,
    });
    await this.auditRepo.log({ entityType: 'Driver', entityId: driver.id, action: 'CREATE', actor });
    return driver;
  }

  async getById(id: string): Promise<Driver> {
    const driver = await this.driverRepo.findById(id);
    if (!driver) throw new EntityNotFoundError('Driver', id);
    return driver;
  }

  async list(status?: string): Promise<Driver[]> { return this.driverRepo.findAll(status); }

  async update(id: string, data: Record<string, unknown>, actor: string): Promise<Driver> {
    await this.getById(id);
    const driver = await this.driverRepo.update(id, data);
    await this.auditRepo.log({ entityType: 'Driver', entityId: id, action: 'UPDATE', actor, changes: data });
    return driver;
  }
}
