import type { Knex } from 'knex';
import type { IngestEvent } from '../../domain/entities/ingest-event.js';
import type { EventSource } from '../../domain/enums/event-source.js';

interface IngestEventRow {
  id: string;
  event_id: string;
  source: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: Record<string, unknown>;
  occurred_at: Date;
  received_at: Date;
  processed_at: Date | null;
}

function toEntity(row: IngestEventRow): IngestEvent {
  return {
    id: row.id,
    eventId: row.event_id,
    source: row.source as EventSource,
    eventType: row.event_type,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    payload: row.payload,
    occurredAt: row.occurred_at,
    receivedAt: row.received_at,
    processedAt: row.processed_at,
  };
}

export interface IngestEventFilters {
  source?: EventSource;
  eventType?: string;
  aggregateType?: string;
  aggregateId?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export class IngestEventRepository {
  constructor(private db: Knex) {}

  async insertIdempotent(
    data: Omit<IngestEvent, 'id' | 'receivedAt' | 'processedAt'>,
    trx?: Knex.Transaction,
  ): Promise<{ event: IngestEvent; isNew: boolean }> {
    const qb = trx || this.db;

    // Use ON CONFLICT DO NOTHING for idempotency
    const result = await qb.raw(
      `INSERT INTO ingest_events (event_id, source, event_type, aggregate_type, aggregate_id, payload, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?::jsonb, ?)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING *`,
      [
        data.eventId,
        data.source,
        data.eventType,
        data.aggregateType,
        data.aggregateId,
        JSON.stringify(data.payload),
        data.occurredAt,
      ],
    );

    if (result.rows.length > 0) {
      return { event: toEntity(result.rows[0]), isNew: true };
    }

    // Already exists — fetch it
    const existing = await qb('ingest_events').where({ event_id: data.eventId }).first();
    return { event: toEntity(existing), isNew: false };
  }

  async findByEventId(eventId: string): Promise<IngestEvent | null> {
    const row = await this.db('ingest_events').where({ event_id: eventId }).first();
    return row ? toEntity(row) : null;
  }

  async findById(id: string): Promise<IngestEvent | null> {
    const row = await this.db('ingest_events').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async query(filters: IngestEventFilters): Promise<IngestEvent[]> {
    let qb = this.db('ingest_events');

    if (filters.source) qb = qb.where('source', filters.source);
    if (filters.eventType) qb = qb.where('event_type', filters.eventType);
    if (filters.aggregateType) qb = qb.where('aggregate_type', filters.aggregateType);
    if (filters.aggregateId) qb = qb.where('aggregate_id', filters.aggregateId);
    if (filters.fromDate) qb = qb.where('occurred_at', '>=', filters.fromDate);
    if (filters.toDate) qb = qb.where('occurred_at', '<=', filters.toDate);

    qb = qb.orderBy('occurred_at', 'desc');
    if (filters.limit) qb = qb.limit(filters.limit);
    if (filters.offset) qb = qb.offset(filters.offset);

    const rows = await qb;
    return rows.map(toEntity);
  }

  async markForReprocessing(eventId: string, trx?: Knex.Transaction): Promise<IngestEvent | null> {
    const qb = trx || this.db;
    const [row] = await qb('ingest_events')
      .where({ event_id: eventId })
      .update({ processed_at: null })
      .returning('*');
    return row ? toEntity(row) : null;
  }

  async markProcessed(eventId: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx || this.db;
    await qb('ingest_events')
      .where({ event_id: eventId })
      .update({ processed_at: new Date() });
  }

  async queryForKpiComputation(
    eventTypes: string[],
    periodStart: Date,
    periodEnd: Date,
  ): Promise<IngestEvent[]> {
    const rows = await this.db('ingest_events')
      .whereIn('event_type', eventTypes)
      .where('occurred_at', '>=', periodStart)
      .where('occurred_at', '<', periodEnd)
      .orderBy('occurred_at', 'asc');
    return rows.map(toEntity);
  }
}
