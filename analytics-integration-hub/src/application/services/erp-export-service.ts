import type { Knex } from 'knex';
import type { ErpExportJob } from '../../domain/entities/erp-export-job.js';
import { ExportType } from '../../domain/enums/export-type.js';
import { ExportStatus } from '../../domain/enums/export-status.js';
import { EntityNotFoundError, ValidationError } from '../../domain/errors/domain-error.js';
import type { ErpExportRepository } from '../../infrastructure/repositories/erp-export-repository.js';
import type { IngestEventRepository } from '../../infrastructure/repositories/ingest-event-repository.js';
import type { KpiSnapshotRepository } from '../../infrastructure/repositories/kpi-snapshot-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export interface CreateExportInput {
  exportType: ExportType;
  filters: Record<string, unknown>;
}

export class ErpExportService {
  constructor(
    private db: Knex,
    private exportRepo: ErpExportRepository,
    private eventRepo: IngestEventRepository,
    private snapshotRepo: KpiSnapshotRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async createExport(input: CreateExportInput, actor: string): Promise<ErpExportJob> {
    return this.db.transaction(async (trx) => {
      const job = await this.exportRepo.create(
        {
          exportType: input.exportType,
          filters: input.filters,
          requestedBy: actor,
        },
        trx,
      );

      await this.auditRepo.log(
        {
          entityType: 'ErpExportJob',
          entityId: job.id,
          action: 'CREATE',
          actor,
          changes: { exportType: input.exportType, filters: input.filters },
        },
        trx,
      );

      // Process export in background after commit
      setImmediate(() => this.processExport(job.id).catch(() => {}));

      return job;
    });
  }

  async getExport(id: string): Promise<ErpExportJob> {
    const job = await this.exportRepo.findById(id);
    if (!job) throw new EntityNotFoundError('ErpExportJob', id);
    return job;
  }

  async listExports(limit: number = 50, offset: number = 0): Promise<ErpExportJob[]> {
    return this.exportRepo.list(limit, offset);
  }

  private async processExport(jobId: string): Promise<void> {
    try {
      // Mark as processing
      await this.exportRepo.updateStatus(jobId, ExportStatus.PROCESSING, {
        startedAt: new Date(),
      });

      const job = await this.exportRepo.findById(jobId);
      if (!job) return;

      let exportData: Record<string, unknown>;

      switch (job.exportType) {
        case ExportType.INVOICE:
          exportData = await this.generateInvoiceExport(job.filters);
          break;
        case ExportType.DELIVERY_SUMMARY:
          exportData = await this.generateDeliverySummaryExport(job.filters);
          break;
        case ExportType.PRODUCTION_REPORT:
          exportData = await this.generateProductionReportExport(job.filters);
          break;
        default:
          throw new ValidationError(`Unknown export type: ${job.exportType}`);
      }

      // Store the result as a data URL (in production, this would be S3/blob storage)
      const resultPayload = JSON.stringify(exportData);
      const resultUrl = `data:application/json;base64,${Buffer.from(resultPayload).toString('base64')}`;

      await this.exportRepo.updateStatus(jobId, ExportStatus.COMPLETED, {
        resultUrl,
        completedAt: new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.exportRepo.updateStatus(jobId, ExportStatus.FAILED, {
        errorMessage: message,
        completedAt: new Date(),
      }).catch(() => {});
    }
  }

  private async generateInvoiceExport(filters: Record<string, unknown>): Promise<Record<string, unknown>> {
    const fromDate = filters.fromDate ? new Date(filters.fromDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = filters.toDate ? new Date(filters.toDate as string) : new Date();
    const customerId = filters.customerId as string | undefined;

    const events = await this.eventRepo.query({
      eventType: 'load.completed',
      fromDate,
      toDate,
      ...(customerId ? { aggregateId: customerId } : {}),
      limit: 10000,
    });

    // Group by customer
    const byCustomer = new Map<string, Array<Record<string, unknown>>>();
    for (const event of events) {
      const cid = (event.payload.customerId as string) || event.aggregateId;
      const items = byCustomer.get(cid) || [];
      items.push({
        loadId: event.payload.loadId || event.aggregateId,
        quantity: event.payload.quantity || event.payload.actualQuantityAmount || 0,
        unit: event.payload.unit || 'CY',
        completedAt: event.occurredAt.toISOString(),
        mixDesign: event.payload.mixDesignCode || null,
        ticketNumber: event.payload.ticketNumber || null,
      });
      byCustomer.set(cid, items);
    }

    return {
      exportType: 'INVOICE',
      generatedAt: new Date().toISOString(),
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      customers: Array.from(byCustomer.entries()).map(([cid, items]) => ({
        customerId: cid,
        lineItems: items,
        totalQuantity: items.reduce((sum, i) => sum + ((i.quantity as number) || 0), 0),
        lineCount: items.length,
      })),
    };
  }

  private async generateDeliverySummaryExport(filters: Record<string, unknown>): Promise<Record<string, unknown>> {
    const fromDate = filters.fromDate ? new Date(filters.fromDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = filters.toDate ? new Date(filters.toDate as string) : new Date();

    const events = await this.eventRepo.query({
      fromDate,
      toDate,
      limit: 10000,
    });

    // Group delivery events by load
    const loadEvents = new Map<string, Array<Record<string, unknown>>>();
    for (const event of events) {
      const loadId = (event.payload.loadId as string) || event.aggregateId;
      const items = loadEvents.get(loadId) || [];
      items.push({
        eventType: event.eventType,
        occurredAt: event.occurredAt.toISOString(),
        source: event.source,
      });
      loadEvents.set(loadId, items);
    }

    return {
      exportType: 'DELIVERY_SUMMARY',
      generatedAt: new Date().toISOString(),
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      totalEvents: events.length,
      totalLoads: loadEvents.size,
      loads: Array.from(loadEvents.entries()).map(([loadId, evts]) => ({
        loadId,
        eventCount: evts.length,
        events: evts,
      })),
    };
  }

  private async generateProductionReportExport(filters: Record<string, unknown>): Promise<Record<string, unknown>> {
    const fromDate = filters.fromDate ? new Date(filters.fromDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = filters.toDate ? new Date(filters.toDate as string) : new Date();
    const plantId = filters.plantId as string | undefined;

    // Get KPI snapshots for the period
    const snapshots = await this.snapshotRepo.query({
      periodStart: fromDate,
      periodEnd: toDate,
      ...(plantId ? { dimensionId: plantId } : {}),
    });

    // Get production events
    const events = await this.eventRepo.query({
      fromDate,
      toDate,
      limit: 10000,
    });

    const completedCount = events.filter(
      (e) => e.eventType === 'load.completed' || e.eventType === 'delivery.plant_returned',
    ).length;

    return {
      exportType: 'PRODUCTION_REPORT',
      generatedAt: new Date().toISOString(),
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      totalEventsProcessed: events.length,
      completedLoads: completedCount,
      kpiSnapshots: snapshots.map((s) => ({
        kpiName: s.kpiName,
        dimension: s.dimension,
        dimensionId: s.dimensionId,
        value: s.value,
        unit: s.unit,
        periodStart: s.periodStart,
        periodEnd: s.periodEnd,
      })),
    };
  }
}
