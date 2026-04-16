import type { FastifyInstance } from 'fastify';
import type { CustomerRepository } from '../../../infrastructure/repositories/customer-repository.js';
import type { SiteRepository } from '../../../infrastructure/repositories/site-repository.js';
import type { JobRepository } from '../../../infrastructure/repositories/job-repository.js';
import type { MixDesignRepository } from '../../../infrastructure/repositories/mix-design-repository.js';
import type { OrderRepository } from '../../../infrastructure/repositories/order-repository.js';
import type { AuditLogRepository } from '../../../infrastructure/repositories/audit-log-repository.js';
import { OrderStatus } from '../../../domain/enums/order-status.js';
import type { UnitOfMeasure } from '../../../domain/enums/unit-of-measure.js';
import {
  ImportCustomerBody,
  ImportSiteBody,
  ImportMixDesignBody,
  ImportOrderBody,
} from '../schemas/import-schemas.js';

export interface ImportDeps {
  customerRepo: CustomerRepository;
  siteRepo: SiteRepository;
  jobRepo: JobRepository;
  mixDesignRepo: MixDesignRepository;
  orderRepo: OrderRepository;
  auditRepo: AuditLogRepository;
}

export function registerImportRoutes(app: FastifyInstance, deps: ImportDeps): void {
  // ── Customer upsert ────────────────────────────────────
  app.put('/customers/import', async (request, reply) => {
    const body = ImportCustomerBody.parse(request.body);
    const customer = await deps.customerRepo.upsertByExternalId({
      externalId: body.externalId,
      name: body.name,
      contactEmail: body.contactEmail ?? null,
      contactPhone: body.contactPhone ?? null,
      billingAddress: body.billingAddress ?? null,
    });

    await deps.auditRepo.log({
      entityType: 'Customer',
      entityId: customer.id,
      action: 'IMPORT',
      actor: request.principal.sub,
    });

    reply.code(200).send(customer);
  });

  // ── Site upsert ────────────────────────────────────────
  app.put('/sites/import', async (request, reply) => {
    const body = ImportSiteBody.parse(request.body);
    const site = await deps.siteRepo.upsert({
      customerId: body.customerId,
      name: body.name,
      address: body.address,
      geoPoint: null,
      geofenceRadiusMeters: null,
      notes: null,
    });

    await deps.auditRepo.log({
      entityType: 'Site',
      entityId: site.id,
      action: 'IMPORT',
      actor: request.principal.sub,
    });

    reply.code(200).send(site);
  });

  // ── Mix Design upsert ──────────────────────────────────
  app.put('/mix-designs/import', async (request, reply) => {
    const body = ImportMixDesignBody.parse(request.body);
    const mixDesign = await deps.mixDesignRepo.upsertByCode({
      code: body.code,
      name: body.name,
      description: body.description ?? null,
      strengthPsi: body.strengthPsi ?? null,
      slumpInches: body.slumpInches ?? null,
      version: 1,
      isActive: true,
    });

    await deps.auditRepo.log({
      entityType: 'MixDesign',
      entityId: mixDesign.id,
      action: 'IMPORT',
      actor: request.principal.sub,
    });

    reply.code(200).send(mixDesign);
  });

  // ── Order upsert ───────────────────────────────────────
  app.put('/orders/import', async (request, reply) => {
    const body = ImportOrderBody.parse(request.body);

    const unit = body.requestedQuantity.unit;

    // Map status string to enum
    const statusMap: Record<string, OrderStatus> = {
      DRAFT: OrderStatus.DRAFT,
      CONFIRMED: OrderStatus.CONFIRMED,
      IN_PROGRESS: OrderStatus.IN_PROGRESS,
      COMPLETED: OrderStatus.COMPLETED,
      CANCELLED: OrderStatus.CANCELLED,
    };
    const status = statusMap[body.status || 'CONFIRMED'] || OrderStatus.CONFIRMED;

    // Find or create a default site and job for this customer
    const jobId = await findOrCreateDefaultJob(deps, body.customerId);

    const order = await deps.orderRepo.upsertByExternalId({
      externalId: body.externalId,
      customerId: body.customerId,
      jobId,
      mixDesignId: body.mixDesignId,
      requestedQuantity: { amount: body.requestedQuantity.amount, unit: unit as UnitOfMeasure },
      requestedDeliveryDate: new Date(body.requestedDeliveryDate),
      requestedDeliveryTime: null,
      specialInstructions: body.specialInstructions ?? null,
      status,
      createdBy: request.principal.sub,
    });

    await deps.auditRepo.log({
      entityType: 'Order',
      entityId: order.id,
      action: 'IMPORT',
      actor: request.principal.sub,
    });

    reply.code(200).send(order);
  });
}

// Creates a default "SAP Import" site + job for a customer if none exists
async function findOrCreateDefaultJob(deps: ImportDeps, customerId: string): Promise<string> {
  // Check for an existing default site
  let site = await deps.siteRepo.findByCustomerAndName(customerId, 'SAP Import (Default)');
  if (!site) {
    site = await deps.siteRepo.create({
      customerId,
      name: 'SAP Import (Default)',
      address: { line1: 'N/A', city: 'N/A', state: 'N/A', postalCode: '00000', country: 'HN' },
      geoPoint: null,
      geofenceRadiusMeters: null,
      notes: 'Auto-created for SAP order import',
    });
  }

  // Check for an existing default job
  const existingJobs = await deps.jobRepo.findByCustomerAndSite(customerId, site.id);
  if (existingJobs) return existingJobs.id;

  const job = await deps.jobRepo.create({
    customerId,
    siteId: site.id,
    name: 'SAP Import',
    description: 'Auto-created for SAP order import',
    startDate: null,
    endDate: null,
  });

  return job.id;
}
