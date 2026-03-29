import type { Knex } from 'knex';
import type { Ticket } from '../../domain/entities/ticket.js';
import { TicketStatus } from '../../domain/enums/ticket-status.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { TicketRepository } from '../../infrastructure/repositories/ticket-repository.js';
import type { LoadRepository } from '../../infrastructure/repositories/load-repository.js';
import type { DeliveryEventRepository } from '../../infrastructure/repositories/delivery-event-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export interface CreateTicketInput {
  orderId: string;
  ticketNumber: string;
  scheduledDate: Date;
  plantId?: string | null;
  notes?: string | null;
}

export interface TicketDetail extends Ticket {
  loads: Array<{
    id: string;
    loadNumber: number;
    status: string;
    truckId: string | null;
    driverId: string | null;
    events: Array<{ state: string; occurredAt: Date; source: string }>;
  }>;
}

export class TicketService {
  constructor(
    private db: Knex,
    private ticketRepo: TicketRepository,
    private loadRepo: LoadRepository,
    private eventRepo: DeliveryEventRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async create(input: CreateTicketInput, actor: string): Promise<Ticket> {
    return this.db.transaction(async (trx) => {
      const ticket = await this.ticketRepo.create(
        {
          orderId: input.orderId,
          ticketNumber: input.ticketNumber,
          status: TicketStatus.CREATED,
          scheduledDate: input.scheduledDate,
          plantId: input.plantId ?? null,
          notes: input.notes ?? null,
          createdBy: actor,
        },
        trx,
      );

      await this.auditRepo.log(
        {
          entityType: 'Ticket',
          entityId: ticket.id,
          action: 'CREATE',
          actor,
        },
        trx,
      );

      return ticket;
    });
  }

  async getDetail(id: string): Promise<TicketDetail> {
    const ticket = await this.ticketRepo.findById(id);
    if (!ticket) throw new EntityNotFoundError('Ticket', id);

    const loads = await this.loadRepo.findByTicketId(id);
    const loadsWithEvents = await Promise.all(
      loads.map(async (load) => {
        const events = await this.eventRepo.findByLoadId(load.id);
        return {
          id: load.id,
          loadNumber: load.loadNumber,
          status: load.status,
          truckId: load.truckId,
          driverId: load.driverId,
          events: events.map((e) => ({
            state: e.state,
            occurredAt: e.occurredAt,
            source: e.source,
          })),
        };
      }),
    );

    return { ...ticket, loads: loadsWithEvents };
  }
}
