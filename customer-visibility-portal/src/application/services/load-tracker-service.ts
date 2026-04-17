import type { Knex } from 'knex';
import type { LoadTracker } from '../../domain/entities/load-tracker.js';
import type { LoadTrackerStatus } from '../../domain/enums/load-tracker-status.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { LoadTrackerRepository } from '../../infrastructure/repositories/load-tracker-repository.js';
import type { TicketViewRepository } from '../../infrastructure/repositories/ticket-view-repository.js';
import type { OrderViewRepository } from '../../infrastructure/repositories/order-view-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export interface UpsertLoadTrackerInput {
  externalLoadId: string;
  ticketId: string;
  loadNumber: number;
  truckId: string | null;
  driverId: string | null;
  status: LoadTrackerStatus;
}

export interface UpdatePositionInput {
  loadId: string;
  latitude: number;
  longitude: number;
  etaMinutes: number | null;
}

export interface LoadEtaResult {
  loadId: string;
  externalLoadId: string;
  loadNumber: number;
  status: string;
  currentLat: number | null;
  currentLon: number | null;
  etaMinutes: number | null;
  lastPositionAt: Date | null;
}

export class LoadTrackerService {
  constructor(
    private db: Knex,
    private loadTrackerRepo: LoadTrackerRepository,
    private ticketViewRepo: TicketViewRepository,
    private orderViewRepo: OrderViewRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async upsert(input: UpsertLoadTrackerInput, actor: string): Promise<LoadTracker> {
    return this.db.transaction(async (trx) => {
      const load = await this.loadTrackerRepo.upsert(
        {
          externalLoadId: input.externalLoadId,
          ticketId: input.ticketId,
          loadNumber: input.loadNumber,
          truckId: input.truckId,
          driverId: input.driverId,
          status: input.status,
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
          entityId: load.id,
          action: 'UPSERT',
          actor,
          changes: { externalLoadId: input.externalLoadId, status: input.status },
        },
        trx,
      );

      return load;
    });
  }

  async updatePosition(input: UpdatePositionInput, actor: string): Promise<void> {
    const load = await this.loadTrackerRepo.findById(input.loadId);
    if (!load) throw new EntityNotFoundError('LoadTracker', input.loadId);

    await this.db.transaction(async (trx) => {
      await this.loadTrackerRepo.updatePosition(
        input.loadId,
        input.latitude,
        input.longitude,
        input.etaMinutes,
        trx,
      );

      await this.auditRepo.log(
        {
          entityType: 'LoadTracker',
          entityId: input.loadId,
          action: 'UPDATE_POSITION',
          actor,
          changes: {
            latitude: input.latitude,
            longitude: input.longitude,
            etaMinutes: input.etaMinutes,
          },
        },
        trx,
      );
    });
  }

  async getById(loadId: string, customerId: string): Promise<LoadTracker> {
    const load = await this.loadTrackerRepo.findById(loadId);
    if (!load) throw new EntityNotFoundError('LoadTracker', loadId);

    const ticket = await this.ticketViewRepo.findById(load.ticketId);
    if (!ticket) throw new EntityNotFoundError('LoadTracker', loadId);

    const order = await this.orderViewRepo.findById(ticket.orderId);
    if (!order || order.customerId !== customerId) {
      throw new EntityNotFoundError('LoadTracker', loadId);
    }

    return load;
  }

  async getEta(loadId: string, customerId: string): Promise<LoadEtaResult> {
    const load = await this.loadTrackerRepo.findById(loadId);
    if (!load) throw new EntityNotFoundError('LoadTracker', loadId);

    // Verify customer ownership through ticket -> order chain
    const ticket = await this.ticketViewRepo.findById(load.ticketId);
    if (!ticket) throw new EntityNotFoundError('LoadTracker', loadId);

    const order = await this.orderViewRepo.findById(ticket.orderId);
    if (!order || order.customerId !== customerId) {
      throw new EntityNotFoundError('LoadTracker', loadId);
    }

    return {
      loadId: load.id,
      externalLoadId: load.externalLoadId,
      loadNumber: load.loadNumber,
      status: load.status,
      currentLat: load.currentLat,
      currentLon: load.currentLon,
      etaMinutes: load.etaMinutes,
      lastPositionAt: load.lastPositionAt,
    };
  }

  async listByTicketId(ticketId: string, customerId: string): Promise<LoadTracker[]> {
    // Verify customer ownership through ticket -> order chain
    const ticket = await this.ticketViewRepo.findById(ticketId);
    if (!ticket) throw new EntityNotFoundError('TicketView', ticketId);

    const order = await this.orderViewRepo.findById(ticket.orderId);
    if (!order || order.customerId !== customerId) {
      throw new EntityNotFoundError('TicketView', ticketId);
    }

    return this.loadTrackerRepo.listByTicketId(ticketId);
  }
}
