import type { Site } from '../../domain/entities/site.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { SiteRepository } from '../../infrastructure/repositories/site-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';
import type { Address } from '../../domain/value-objects/address.js';
import type { GeoPoint } from '../../domain/value-objects/geo-point.js';

export interface CreateSiteInput {
  customerId: string;
  name: string;
  address: Address;
  geoPoint?: GeoPoint | null;
  geofenceRadiusMeters?: number | null;
  notes?: string | null;
}

export class SiteService {
  constructor(
    private siteRepo: SiteRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async create(input: CreateSiteInput, actor: string): Promise<Site> {
    const site = await this.siteRepo.create({
      customerId: input.customerId,
      name: input.name,
      address: input.address,
      geoPoint: input.geoPoint ?? null,
      geofenceRadiusMeters: input.geofenceRadiusMeters ?? null,
      notes: input.notes ?? null,
    });

    await this.auditRepo.log({
      entityType: 'Site',
      entityId: site.id,
      action: 'CREATE',
      actor,
    });

    return site;
  }

  async getById(id: string): Promise<Site> {
    const site = await this.siteRepo.findById(id);
    if (!site) throw new EntityNotFoundError('Site', id);
    return site;
  }
}
