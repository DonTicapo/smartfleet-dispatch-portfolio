import type { Knex } from 'knex';
import type { TicketView } from '../../domain/entities/ticket-view.js';
import type { TicketViewStatus } from '../../domain/enums/ticket-view-status.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { TicketViewRepository } from '../../infrastructure/repositories/ticket-view-repository.js';
import type { OrderViewRepository } from '../../infrastructure/repositories/order-view-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export interface UpsertTicketViewInput {
  externalTicketId: string;
  orderId: string;
  ticketNumber: string;
  status: TicketViewStatus;
  scheduledDate: Date;
  plantId: string | null;
}

export class TicketViewService {
  constructor(
    private db: Knex,
    private ticketViewRepo: TicketViewRepository,
    private orderViewRepo: OrderViewRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async upsert(input: UpsertTicketViewInput, actor: string): Promise<TicketView> {
    return this.db.transaction(async (trx) => {
      const ticket = await this.ticketViewRepo.upsert(
        {
          externalTicketId: input.externalTicketId,
          orderId: input.orderId,
          ticketNumber: input.ticketNumber,
          status: input.status,
          scheduledDate: input.scheduledDate,
          plantId: input.plantId,
          lastSyncedAt: new Date(),
        },
        trx,
      );

      await this.auditRepo.log(
        {
          entityType: 'TicketView',
          entityId: ticket.id,
          action: 'UPSERT',
          actor,
          changes: { externalTicketId: input.externalTicketId, status: input.status },
        },
        trx,
      );

      return ticket;
    });
  }

  async getById(id: string, customerId: string): Promise<TicketView> {
    const ticket = await this.ticketViewRepo.findById(id);
    if (!ticket) throw new EntityNotFoundError('TicketView', id);

    // Verify customer ownership through order
    const order = await this.orderViewRepo.findById(ticket.orderId);
    if (!order || order.customerId !== customerId) {
      throw new EntityNotFoundError('TicketView', id);
    }

    return ticket;
  }

  async listByOrderId(orderId: string, customerId: string): Promise<TicketView[]> {
    // Verify customer ownership of the order
    const order = await this.orderViewRepo.findById(orderId);
    if (!order || order.customerId !== customerId) {
      throw new EntityNotFoundError('OrderView', orderId);
    }

    return this.ticketViewRepo.listByOrderId(orderId);
  }
}
