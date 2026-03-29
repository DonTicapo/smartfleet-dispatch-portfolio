import type { Knex } from 'knex';
import type { BatchEvent } from '../../domain/entities/batch-event.js';
import type { BatchEventType } from '../../domain/enums/batch-event-type.js';

interface BatchEventRow {
  id: string;
  event_id: string;
  plant_id: string;
  mixer_id: string;
  ticket_number: string | null;
  batch_number: string;
  event_type: string;
  payload: Record<string, unknown>;
  occurred_at: Date;
  received_at: Date;
}

function toEntity(row: BatchEventRow): BatchEvent {
  return {
    id: row.id,
    eventId: row.event_id,
    plantId: row.plant_id,
    mixerId: row.mixer_id,
    ticketNumber: row.ticket_number,
    batchNumber: row.batch_number,
    eventType: row.event_type as BatchEventType,
    payload: row.payload,
    occurredAt: row.occurred_at,
    receivedAt: row.received_at,
  };
}

export interface BatchEventFilters {
  plantId?: string;
  mixerId?: string;
  ticketNumber?: string;
  eventType?: BatchEventType;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export class BatchEventRepository {
  constructor(private db: Knex) {}

  async create(
    data: Omit<BatchEvent, 'id' | 'receivedAt'>,
    trx?: Knex.Transaction,
  ): Promise<BatchEvent> {
    const qb = trx || this.db;
    const [row] = await qb('batch_events')
      .insert({
        event_id: data.eventId,
        plant_id: data.plantId,
        mixer_id: data.mixerId,
        ticket_number: data.ticketNumber,
        batch_number: data.batchNumber,
        event_type: data.eventType,
        payload: JSON.stringify(data.payload),
        occurred_at: data.occurredAt,
      })
      .returning('*');
    return toEntity(row);
  }

  async findByEventId(eventId: string): Promise<BatchEvent | null> {
    const row = await this.db('batch_events').where({ event_id: eventId }).first();
    return row ? toEntity(row) : null;
  }

  async findById(id: string): Promise<BatchEvent | null> {
    const row = await this.db('batch_events').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findAll(filters: BatchEventFilters): Promise<BatchEvent[]> {
    let query = this.db('batch_events').orderBy('occurred_at', 'desc');

    if (filters.plantId) query = query.where({ plant_id: filters.plantId });
    if (filters.mixerId) query = query.where({ mixer_id: filters.mixerId });
    if (filters.ticketNumber) query = query.where({ ticket_number: filters.ticketNumber });
    if (filters.eventType) query = query.where({ event_type: filters.eventType });
    if (filters.from) query = query.where('occurred_at', '>=', filters.from);
    if (filters.to) query = query.where('occurred_at', '<=', filters.to);

    const limit = filters.limit ?? 100;
    const offset = filters.offset ?? 0;
    query = query.limit(limit).offset(offset);

    const rows = await query;
    return rows.map(toEntity);
  }

  /**
   * Idempotent insert: returns existing event if eventId already exists,
   * otherwise creates new event.
   */
  async upsertByEventId(
    data: Omit<BatchEvent, 'id' | 'receivedAt'>,
    trx?: Knex.Transaction,
  ): Promise<{ event: BatchEvent; created: boolean }> {
    const existing = await (trx || this.db)('batch_events')
      .where({ event_id: data.eventId })
      .first();

    if (existing) {
      return { event: toEntity(existing), created: false };
    }

    const event = await this.create(data, trx);
    return { event, created: true };
  }
}
