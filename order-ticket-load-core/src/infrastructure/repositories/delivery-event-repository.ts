import type { Knex } from 'knex';
import type { DeliveryStateEvent } from '../../domain/entities/delivery-state-event.js';
import type { DeliveryState } from '../../domain/enums/delivery-state.js';

interface EventRow {
  id: string;
  event_id: string;
  load_id: string;
  state: string;
  occurred_at: Date;
  source: string;
  source_event_id: string | null;
  payload: Record<string, unknown> | null;
  received_at: Date;
}

function toEntity(row: EventRow): DeliveryStateEvent {
  return {
    id: row.id,
    eventId: row.event_id,
    loadId: row.load_id,
    state: row.state as DeliveryState,
    occurredAt: row.occurred_at,
    source: row.source,
    sourceEventId: row.source_event_id,
    payload: row.payload,
    receivedAt: row.received_at,
  };
}

export interface InsertResult {
  event: DeliveryStateEvent;
  isNew: boolean;
}

export class DeliveryEventRepository {
  constructor(private db: Knex) {}

  async insertIdempotent(
    data: Omit<DeliveryStateEvent, 'id' | 'receivedAt'>,
    trx?: Knex.Transaction,
  ): Promise<InsertResult> {
    const qb = trx || this.db;

    // Try insert with ON CONFLICT DO NOTHING
    const result = await qb.raw(
      `INSERT INTO delivery_state_events (event_id, load_id, state, occurred_at, source, source_event_id, payload)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING *`,
      [
        data.eventId,
        data.loadId,
        data.state,
        data.occurredAt,
        data.source,
        data.sourceEventId ?? null,
        data.payload ? JSON.stringify(data.payload) : null,
      ],
    );

    if (result.rows.length > 0) {
      return { event: toEntity(result.rows[0]), isNew: true };
    }

    // Event already existed — fetch and return it
    const existing = await qb('delivery_state_events').where({ event_id: data.eventId }).first();
    return { event: toEntity(existing), isNew: false };
  }

  async findByLoadId(loadId: string): Promise<DeliveryStateEvent[]> {
    const rows = await this.db('delivery_state_events')
      .where({ load_id: loadId })
      .orderBy('occurred_at', 'asc');
    return rows.map(toEntity);
  }
}
