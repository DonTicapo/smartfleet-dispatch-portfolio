import type { Knex } from 'knex';
import { SapSyncEntityType } from '../../domain/enums/sap-sync-entity-type.js';
import { SapSyncStatus } from '../../domain/enums/sap-sync-status.js';
import type { SapSyncCursor } from '../../domain/entities/sap-sync-cursor.js';
import type { SapMirrorRepository, SapCustomerRow, SapItemRow, SapOrderRow } from '../../infrastructure/repositories/sap-mirror-repository.js';
import type { SapSyncRepository } from '../../infrastructure/repositories/sap-sync-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

interface SyncResult {
  entityType: SapSyncEntityType;
  status: 'success' | 'failed';
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface SyncRunResult {
  startedAt: Date;
  completedAt: Date;
  companyDb: string;
  results: SyncResult[];
}

const CITY_FROM_WAREHOUSE: Record<string, string> = {
  SPSPT: 'San Pedro Sula',
  TGUPT: 'Tegucigalpa',
  CORPT: 'Puerto Cortés',
  CEIPT: 'La Ceiba',
  CSJPT: 'San Jorge',
  CHOPT: 'Choloma',
  SBCPT: 'Santa Bárbara',
  STELPT: 'Santa Elena',
};

export class SapSyncService {
  constructor(
    private db: Knex,
    private mirrorRepo: SapMirrorRepository,
    private syncRepo: SapSyncRepository,
    private auditRepo: AuditLogRepository,
    private otlCoreUrl: string,
    private peobUrl: string,
    private companyDb: string,
  ) {}

  async runFullSync(actor: string): Promise<SyncRunResult> {
    const startedAt = new Date();
    const results: SyncResult[] = [];

    // Sync in dependency order: plants → customers → sites → mix_designs → orders
    results.push(await this.syncPlants(actor));
    results.push(await this.syncCustomers(actor));
    results.push(await this.syncSites(actor));
    results.push(await this.syncMixDesigns(actor));
    results.push(await this.syncOrders(actor));

    const completedAt = new Date();
    return { startedAt, completedAt, companyDb: this.companyDb, results };
  }

  async runEntitySync(entityType: SapSyncEntityType, actor: string): Promise<SyncResult> {
    switch (entityType) {
      case SapSyncEntityType.PLANT:
        return this.syncPlants(actor);
      case SapSyncEntityType.CUSTOMER:
        return this.syncCustomers(actor);
      case SapSyncEntityType.SITE:
        return this.syncSites(actor);
      case SapSyncEntityType.MIX_DESIGN:
        return this.syncMixDesigns(actor);
      case SapSyncEntityType.ORDER:
        return this.syncOrders(actor);
    }
  }

  async getSyncStatus(): Promise<SapSyncCursor[]> {
    return this.syncRepo.listCursors();
  }

  async getMirrorStats(): Promise<Array<{ entityType: string; count: number }>> {
    return this.mirrorRepo.getRecordCounts();
  }

  // ── Plants ──────────────────────────────────────────────

  private async syncPlants(actor: string): Promise<SyncResult> {
    const entityType = SapSyncEntityType.PLANT;
    const result: SyncResult = { entityType, status: 'success', created: 0, updated: 0, skipped: 0, errors: [] };

    await this.syncRepo.upsertCursor(entityType, { status: SapSyncStatus.RUNNING, startedAt: new Date() });

    try {
      const warehouses = await this.mirrorRepo.getWarehouses();

      for (const wh of warehouses) {
        try {
          const existing = await this.syncRepo.getMapping(entityType, wh.warehouseCode, this.companyDb);
          const body = {
            code: wh.warehouseCode,
            name: wh.warehouseName,
            location: CITY_FROM_WAREHOUSE[wh.warehouseCode]
              ? { latitude: 0, longitude: 0, city: CITY_FROM_WAREHOUSE[wh.warehouseCode] }
              : null,
            timezone: 'America/Tegucigalpa',
            isActive: wh.inactive !== 'tYES',
          };

          const res = await this.httpPut(`${this.peobUrl}/plants/import`, body);
          if (res.id) {
            await this.syncRepo.upsertMapping({
              entityType,
              sapKey: wh.warehouseCode,
              smartfleetId: res.id,
              sapCompanyDb: this.companyDb,
            });
            existing ? result.updated++ : result.created++;
          }
        } catch (err) {
          result.errors.push(`Plant ${wh.warehouseCode}: ${errorMessage(err)}`);
        }
      }

      await this.finishCursor(entityType, result);
    } catch (err) {
      await this.failCursor(entityType, errorMessage(err));
      result.status = 'failed';
      result.errors.push(errorMessage(err));
    }

    return result;
  }

  // ── Customers ───────────────────────────────────────────

  private async syncCustomers(actor: string): Promise<SyncResult> {
    const entityType = SapSyncEntityType.CUSTOMER;
    const result: SyncResult = { entityType, status: 'success', created: 0, updated: 0, skipped: 0, errors: [] };

    await this.syncRepo.upsertCursor(entityType, { status: SapSyncStatus.RUNNING, startedAt: new Date() });

    try {
      const cursor = await this.syncRepo.getCursor(entityType);
      const customers = await this.mirrorRepo.getCustomers(cursor?.lastSyncedAt ?? undefined);

      for (const cust of customers) {
        try {
          const existing = await this.syncRepo.getMapping(entityType, cust.cardCode, this.companyDb);
          const billingAddr = this.extractBillingAddress(cust);

          const body = {
            externalId: cust.cardCode,
            name: cust.cardName,
            contactEmail: cust.emailAddress || null,
            contactPhone: cust.phone1 || null,
            billingAddress: billingAddr,
          };

          const res = await this.httpPut(`${this.otlCoreUrl}/customers/import`, body);
          if (res.id) {
            await this.syncRepo.upsertMapping({
              entityType,
              sapKey: cust.cardCode,
              smartfleetId: res.id,
              sapCompanyDb: this.companyDb,
            });
            existing ? result.updated++ : result.created++;
          }
        } catch (err) {
          result.errors.push(`Customer ${cust.cardCode}: ${errorMessage(err)}`);
        }
      }

      await this.finishCursor(entityType, result);
    } catch (err) {
      await this.failCursor(entityType, errorMessage(err));
      result.status = 'failed';
      result.errors.push(errorMessage(err));
    }

    return result;
  }

  // ── Sites ───────────────────────────────────────────────

  private async syncSites(actor: string): Promise<SyncResult> {
    const entityType = SapSyncEntityType.SITE;
    const result: SyncResult = { entityType, status: 'success', created: 0, updated: 0, skipped: 0, errors: [] };

    await this.syncRepo.upsertCursor(entityType, { status: SapSyncStatus.RUNNING, startedAt: new Date() });

    try {
      const cursor = await this.syncRepo.getCursor(entityType);
      const customers = await this.mirrorRepo.getCustomers(cursor?.lastSyncedAt ?? undefined);

      for (const cust of customers) {
        const shipToAddrs = (cust.addresses || []).filter((a) => a.AddressType === 'bo_ShipTo');
        if (shipToAddrs.length === 0) continue;

        // Resolve the customer's SmartFleet ID
        const custMapping = await this.syncRepo.getMapping(SapSyncEntityType.CUSTOMER, cust.cardCode, this.companyDb);
        if (!custMapping) {
          result.skipped += shipToAddrs.length;
          continue;
        }

        for (const addr of shipToAddrs) {
          const sapKey = `${cust.cardCode}::${addr.AddressName}`;
          try {
            const existing = await this.syncRepo.getMapping(entityType, sapKey, this.companyDb);
            const body = {
              customerId: custMapping.smartfleetId,
              name: addr.AddressName || cust.cardName,
              address: {
                line1: addr.Street || addr.AddressName || 'N/A',
                city: addr.City || 'N/A',
                state: addr.State || 'N/A',
                postalCode: addr.ZipCode || '00000',
                country: addr.Country || 'HN',
              },
            };

            const res = await this.httpPut(`${this.otlCoreUrl}/sites/import`, body);
            if (res.id) {
              await this.syncRepo.upsertMapping({
                entityType,
                sapKey,
                smartfleetId: res.id,
                sapCompanyDb: this.companyDb,
              });
              existing ? result.updated++ : result.created++;
            }
          } catch (err) {
            result.errors.push(`Site ${sapKey}: ${errorMessage(err)}`);
          }
        }
      }

      await this.finishCursor(entityType, result);
    } catch (err) {
      await this.failCursor(entityType, errorMessage(err));
      result.status = 'failed';
      result.errors.push(errorMessage(err));
    }

    return result;
  }

  // ── Mix Designs ─────────────────────────────────────────

  private async syncMixDesigns(actor: string): Promise<SyncResult> {
    const entityType = SapSyncEntityType.MIX_DESIGN;
    const result: SyncResult = { entityType, status: 'success', created: 0, updated: 0, skipped: 0, errors: [] };

    await this.syncRepo.upsertCursor(entityType, { status: SapSyncStatus.RUNNING, startedAt: new Date() });

    try {
      const cursor = await this.syncRepo.getCursor(entityType);
      const items = await this.mirrorRepo.getConcreteItems(cursor?.lastSyncedAt ?? undefined);

      for (const item of items) {
        try {
          const existing = await this.syncRepo.getMapping(entityType, item.itemCode, this.companyDb);
          const body = {
            code: item.itemCode,
            name: item.itemName,
            description: item.userText || item.foreignName || item.itemName,
            strengthPsi: item.strengthPsi || null,
            slumpInches: null,
          };

          const res = await this.httpPut(`${this.otlCoreUrl}/mix-designs/import`, body);
          if (res.id) {
            await this.syncRepo.upsertMapping({
              entityType,
              sapKey: item.itemCode,
              smartfleetId: res.id,
              sapCompanyDb: this.companyDb,
            });
            existing ? result.updated++ : result.created++;
          }
        } catch (err) {
          result.errors.push(`MixDesign ${item.itemCode}: ${errorMessage(err)}`);
        }
      }

      await this.finishCursor(entityType, result);
    } catch (err) {
      await this.failCursor(entityType, errorMessage(err));
      result.status = 'failed';
      result.errors.push(errorMessage(err));
    }

    return result;
  }

  // ── Orders ──────────────────────────────────────────────

  private async syncOrders(actor: string): Promise<SyncResult> {
    const entityType = SapSyncEntityType.ORDER;
    const result: SyncResult = { entityType, status: 'success', created: 0, updated: 0, skipped: 0, errors: [] };

    await this.syncRepo.upsertCursor(entityType, { status: SapSyncStatus.RUNNING, startedAt: new Date() });

    try {
      const cursor = await this.syncRepo.getCursor(entityType);
      const orders = await this.mirrorRepo.getOpenOrders(cursor?.lastSyncedAt ?? undefined);

      for (const order of orders) {
        const lines = order.lines || [];
        if (lines.length === 0) {
          result.skipped++;
          continue;
        }

        // Resolve customer
        const custMapping = await this.syncRepo.getMapping(SapSyncEntityType.CUSTOMER, order.cardCode, this.companyDb);
        if (!custMapping) {
          result.skipped++;
          continue;
        }

        // Split multi-line orders: one SmartFleet order per line
        for (const line of lines) {
          const sapKey = `${order.docEntry}-${line.LineNum}`;
          try {
            // Resolve mix design
            const mixMapping = await this.syncRepo.getMapping(SapSyncEntityType.MIX_DESIGN, line.ItemCode, this.companyDb);
            if (!mixMapping) {
              result.skipped++;
              continue;
            }

            const existing = await this.syncRepo.getMapping(entityType, sapKey, this.companyDb);

            // Map SAP status
            let status = 'DRAFT';
            if (order.cancelled === 'tYES') {
              status = 'CANCELLED';
            } else if (order.documentStatus === 'bost_Close') {
              status = 'COMPLETED';
            } else if (order.documentStatus === 'bost_Open') {
              status = 'CONFIRMED';
            }

            const body = {
              externalId: sapKey,
              customerId: custMapping.smartfleetId,
              mixDesignId: mixMapping.smartfleetId,
              requestedQuantity: {
                amount: line.Quantity,
                unit: 'M3' as const,
              },
              requestedDeliveryDate: order.docDueDate,
              specialInstructions: order.comments || null,
              status,
            };

            const res = await this.httpPut(`${this.otlCoreUrl}/orders/import`, body);
            if (res.id) {
              await this.syncRepo.upsertMapping({
                entityType,
                sapKey,
                smartfleetId: res.id,
                sapCompanyDb: this.companyDb,
              });
              existing ? result.updated++ : result.created++;
            }
          } catch (err) {
            result.errors.push(`Order ${sapKey}: ${errorMessage(err)}`);
          }
        }
      }

      await this.finishCursor(entityType, result);
    } catch (err) {
      await this.failCursor(entityType, errorMessage(err));
      result.status = 'failed';
      result.errors.push(errorMessage(err));
    }

    return result;
  }

  // ── Helpers ─────────────────────────────────────────────

  private extractBillingAddress(cust: SapCustomerRow): Record<string, string> | null {
    const billTo = (cust.addresses || []).find((a) => a.AddressType === 'bo_BillTo');
    if (!billTo) return null;
    return {
      line1: billTo.Street || billTo.AddressName || 'N/A',
      city: billTo.City || 'N/A',
      state: billTo.State || 'N/A',
      postalCode: billTo.ZipCode || '00000',
      country: billTo.Country || 'HN',
    };
  }

  private async httpPut(url: string, body: unknown): Promise<{ id: string; [k: string]: unknown }> {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.getServiceToken()}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json() as Promise<{ id: string }>;
  }

  private getServiceToken(): string {
    // Service-to-service JWT — in production, use proper service credentials
    // For portfolio, we use a shared dev token
    return 'sap-sync-service';
  }

  private async finishCursor(entityType: SapSyncEntityType, result: SyncResult): Promise<void> {
    await this.syncRepo.upsertCursor(entityType, {
      status: result.errors.length > 0 ? SapSyncStatus.COMPLETED : SapSyncStatus.COMPLETED,
      lastSyncedAt: new Date(),
      recordsSynced: result.created + result.updated,
      completedAt: new Date(),
      errorMessage: result.errors.length > 0 ? result.errors.slice(0, 5).join('; ') : null,
    });
  }

  private async failCursor(entityType: SapSyncEntityType, message: string): Promise<void> {
    await this.syncRepo.upsertCursor(entityType, {
      status: SapSyncStatus.FAILED,
      errorMessage: message,
      completedAt: new Date(),
    });
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
