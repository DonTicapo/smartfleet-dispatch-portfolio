import type { Knex } from 'knex';
import type { TicketView } from '../../domain/entities/ticket-view.js';
import type { TicketViewStatus } from '../../domain/enums/ticket-view-status.js';

interface TicketViewRow {
  id: string;
  external_ticket_id: string;
  order_id: string;
  ticket_number: string;
  status: string;
  scheduled_date: Date;
  plant_id: string | null;
  last_synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: TicketViewRow): TicketView {
  return {
    id: row.id,
    externalTicketId: row.external_ticket_id,
    orderId: row.order_id,
    ticketNumber: row.ticket_number,
    status: row.status as TicketViewStatus,
    scheduledDate: row.scheduled_date,
    plantId: row.plant_id,
    lastSyncedAt: row.last_synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class TicketViewRepository {
  constructor(private db: Knex) {}

  async upsert(
    data: Omit<TicketView, 'id' | 'createdAt' | 'updatedAt'>,
    trx?: Knex.Transaction,
  ): Promise<TicketView> {
    const qb = trx || this.db;
    const insertData = {
      external_ticket_id: data.externalTicketId,
      order_id: data.orderId,
      ticket_number: data.ticketNumber,
      status: data.status,
      scheduled_date: data.scheduledDate,
      plant_id: data.plantId,
      last_synced_at: data.lastSyncedAt,
    };

    const [row] = await qb('ticket_views')
      .insert(insertData)
      .onConflict('external_ticket_id')
      .merge({
        ...insertData,
        updated_at: new Date(),
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<TicketView | null> {
    const row = await this.db('ticket_views').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findByExternalId(externalTicketId: string): Promise<TicketView | null> {
    const row = await this.db('ticket_views')
      .where({ external_ticket_id: externalTicketId })
      .first();
    return row ? toEntity(row) : null;
  }

  async listByOrderId(orderId: string): Promise<TicketView[]> {
    const rows = await this.db('ticket_views')
      .where({ order_id: orderId })
      .orderBy('scheduled_date', 'asc');
    return rows.map(toEntity);
  }

  async updateStatus(
    id: string,
    status: TicketViewStatus,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const qb = trx || this.db;
    await qb('ticket_views').where({ id }).update({ status, updated_at: new Date() });
  }
}
