import type { Knex } from 'knex';
import type { Ticket } from '../../domain/entities/ticket.js';
import type { TicketStatus } from '../../domain/enums/ticket-status.js';

interface TicketRow {
  id: string;
  order_id: string;
  ticket_number: string;
  status: string;
  scheduled_date: Date;
  plant_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: TicketRow): Ticket {
  return {
    id: row.id,
    orderId: row.order_id,
    ticketNumber: row.ticket_number,
    status: row.status as TicketStatus,
    scheduledDate: row.scheduled_date,
    plantId: row.plant_id,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class TicketRepository {
  constructor(private db: Knex) {}

  async create(
    data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>,
    trx?: Knex.Transaction,
  ): Promise<Ticket> {
    const qb = trx || this.db;
    const [row] = await qb('tickets')
      .insert({
        order_id: data.orderId,
        ticket_number: data.ticketNumber,
        status: data.status,
        scheduled_date: data.scheduledDate,
        plant_id: data.plantId,
        notes: data.notes,
        created_by: data.createdBy,
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<Ticket | null> {
    const row = await this.db('tickets').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async updateStatus(id: string, status: TicketStatus, trx?: Knex.Transaction): Promise<void> {
    const qb = trx || this.db;
    await qb('tickets').where({ id }).update({ status, updated_at: new Date() });
  }
}
