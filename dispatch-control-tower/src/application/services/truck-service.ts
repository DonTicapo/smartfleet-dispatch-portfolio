import type { Truck } from '../../domain/entities/truck.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { TruckRepository } from '../../infrastructure/repositories/truck-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export class TruckService {
  constructor(private truckRepo: TruckRepository, private auditRepo: AuditLogRepository) {}

  async create(data: { number: string; externalId?: string | null; licensePlate?: string | null; capacityAmount?: number | null; capacityUnit?: string; homePlantId?: string | null; notes?: string | null }, actor: string): Promise<Truck> {
    const truck = await this.truckRepo.create({
      number: data.number, external_id: data.externalId ?? null, license_plate: data.licensePlate ?? null,
      capacity_amount: data.capacityAmount ?? null, capacity_unit: data.capacityUnit ?? 'CY',
      home_plant_id: data.homePlantId ?? null, notes: data.notes ?? null,
    });
    await this.auditRepo.log({ entityType: 'Truck', entityId: truck.id, action: 'CREATE', actor });
    return truck;
  }

  async getById(id: string): Promise<Truck> {
    const truck = await this.truckRepo.findById(id);
    if (!truck) throw new EntityNotFoundError('Truck', id);
    return truck;
  }

  async list(status?: string): Promise<Truck[]> { return this.truckRepo.findAll(status); }

  async update(id: string, data: Record<string, unknown>, actor: string): Promise<Truck> {
    await this.getById(id);
    const truck = await this.truckRepo.update(id, data);
    await this.auditRepo.log({ entityType: 'Truck', entityId: id, action: 'UPDATE', actor, changes: data });
    return truck;
  }
}
