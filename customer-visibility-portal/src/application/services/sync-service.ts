import type { Knex } from 'knex';
import type { OtlCoreClient } from '../../infrastructure/clients/otl-core-client.js';
import type { NavixyBridgeClient } from '../../infrastructure/clients/navixy-bridge-client.js';
import type { OrderViewRepository } from '../../infrastructure/repositories/order-view-repository.js';
import type { TicketViewRepository } from '../../infrastructure/repositories/ticket-view-repository.js';
import type { LoadTrackerRepository } from '../../infrastructure/repositories/load-tracker-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';
import type { OrderViewStatus } from '../../domain/enums/order-view-status.js';
import type { TicketViewStatus } from '../../domain/enums/ticket-view-status.js';
import type { LoadTrackerStatus } from '../../domain/enums/load-tracker-status.js';

export interface SyncOrdersResult {
  ordersUpserted: number;
  ticketsUpserted: number;
  loadsUpserted: number;
  errors: string[];
}

export interface SyncPositionsResult {
  positionsUpdated: number;
  errors: string[];
}

export class SyncService {
  constructor(
    private db: Knex,
    private otlClient: OtlCoreClient,
    private navixyClient: NavixyBridgeClient,
    private orderViewRepo: OrderViewRepository,
    private ticketViewRepo: TicketViewRepository,
    private loadTrackerRepo: LoadTrackerRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  /**
   * Pulls orders, tickets, and loads from OTL Core for a given customer
   * and upserts them into the portal's local projection tables.
   */
  async syncOrdersFromOtl(customerId: string, actor: string): Promise<SyncOrdersResult> {
    const result: SyncOrdersResult = {
      ordersUpserted: 0,
      ticketsUpserted: 0,
      loadsUpserted: 0,
      errors: [],
    };

    let orders;
    try {
      orders = await this.otlClient.getOrdersByCustomer(customerId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching orders';
      result.errors.push(message);
      return result;
    }

    for (const otlOrder of orders) {
      try {
        // Fetch related entities to denormalize into the order view
        const [job, mixDesign] = await Promise.all([
          this.otlClient.getJob(otlOrder.jobId),
          this.otlClient.getMixDesign(otlOrder.mixDesignId),
        ]);

        let siteName = 'Unknown Site';
        try {
          const site = await this.otlClient.getSite(job.siteId);
          siteName = site.name;
        } catch {
          // Site lookup may fail; use fallback
        }

        await this.db.transaction(async (trx) => {
          const orderView = await this.orderViewRepo.upsert(
            {
              externalOrderId: otlOrder.id,
              customerId: otlOrder.customerId,
              jobName: job.name,
              siteName,
              mixDesignName: mixDesign.name,
              requestedQuantity: otlOrder.requestedQuantity,
              requestedDeliveryDate: new Date(otlOrder.requestedDeliveryDate),
              status: otlOrder.status as OrderViewStatus,
              lastSyncedAt: new Date(),
            },
            trx,
          );

          await this.auditRepo.log(
            {
              entityType: 'OrderView',
              entityId: orderView.id,
              action: 'SYNC',
              actor,
              changes: { source: 'otl-core', externalOrderId: otlOrder.id },
            },
            trx,
          );

          result.ordersUpserted++;

          // Sync tickets for this order
          let tickets;
          try {
            tickets = await this.otlClient.getTicketsByOrder(otlOrder.id);
          } catch {
            result.errors.push(`Failed to fetch tickets for order ${otlOrder.id}`);
            return;
          }

          for (const otlTicket of tickets) {
            const ticketView = await this.ticketViewRepo.upsert(
              {
                externalTicketId: otlTicket.id,
                orderId: orderView.id,
                ticketNumber: otlTicket.ticketNumber,
                status: otlTicket.status as TicketViewStatus,
                scheduledDate: new Date(otlTicket.scheduledDate),
                plantId: otlTicket.plantId,
                lastSyncedAt: new Date(),
              },
              trx,
            );

            await this.auditRepo.log(
              {
                entityType: 'TicketView',
                entityId: ticketView.id,
                action: 'SYNC',
                actor,
                changes: { source: 'otl-core', externalTicketId: otlTicket.id },
              },
              trx,
            );

            result.ticketsUpserted++;

            // Sync loads for this ticket
            let loads;
            try {
              loads = await this.otlClient.getLoadsByTicket(otlTicket.id);
            } catch {
              result.errors.push(`Failed to fetch loads for ticket ${otlTicket.id}`);
              continue;
            }

            for (const otlLoad of loads) {
              const loadTracker = await this.loadTrackerRepo.upsert(
                {
                  externalLoadId: otlLoad.id,
                  ticketId: ticketView.id,
                  loadNumber: otlLoad.loadNumber,
                  truckId: otlLoad.truckId,
                  driverId: otlLoad.driverId,
                  status: otlLoad.status as LoadTrackerStatus,
                  currentLat: null,
                  currentLon: null,
                  etaMinutes: null,
                  lastPositionAt: null,
                  lastSyncedAt: new Date(),
                },
                trx,
              );

              await this.auditRepo.log(
                {
                  entityType: 'LoadTracker',
                  entityId: loadTracker.id,
                  action: 'SYNC',
                  actor,
                  changes: { source: 'otl-core', externalLoadId: otlLoad.id },
                },
                trx,
              );

              result.loadsUpserted++;
            }
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error syncing order';
        result.errors.push(`Order ${otlOrder.id}: ${message}`);
      }
    }

    return result;
  }

  /**
   * Updates load tracker positions from Navixy Bridge for loads
   * that have an associated truck and are in active statuses.
   */
  async syncPositionsFromNavixy(customerId: string, actor: string): Promise<SyncPositionsResult> {
    const result: SyncPositionsResult = {
      positionsUpdated: 0,
      errors: [],
    };

    // Get all active loads for this customer
    let activeLoads;
    try {
      activeLoads = await this.loadTrackerRepo.listActiveByCustomer(customerId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push(`Failed to list active loads: ${message}`);
      return result;
    }

    // Filter to loads that have a truckId (which maps to a tracker)
    const loadsWithTrucks = activeLoads.filter((load) => load.truckId !== null);
    if (loadsWithTrucks.length === 0) {
      return result;
    }

    // Get tracker IDs (truckId acts as the tracker identifier)
    const trackerIds = loadsWithTrucks.map((load) => load.truckId!);
    let positions;
    try {
      positions = await this.navixyClient.getTrackerPositions(trackerIds);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push(`Failed to fetch positions: ${message}`);
      return result;
    }

    // Update each load with its position data
    for (const load of loadsWithTrucks) {
      const position = positions.get(load.truckId!);
      if (!position) continue;

      try {
        // Simple ETA estimation: if load is EN_ROUTE, estimate based on distance
        // In production, this would use a routing API
        const etaMinutes = load.etaMinutes; // Keep existing ETA if no better estimate

        await this.db.transaction(async (trx) => {
          await this.loadTrackerRepo.updatePosition(
            load.id,
            position.latitude,
            position.longitude,
            etaMinutes,
            trx,
          );

          await this.auditRepo.log(
            {
              entityType: 'LoadTracker',
              entityId: load.id,
              action: 'POSITION_SYNC',
              actor,
              changes: {
                source: 'navixy-bridge',
                latitude: position.latitude,
                longitude: position.longitude,
              },
            },
            trx,
          );
        });

        result.positionsUpdated++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        result.errors.push(`Load ${load.id}: ${message}`);
      }
    }

    return result;
  }
}
