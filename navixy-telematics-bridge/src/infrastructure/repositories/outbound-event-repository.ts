import type { Knex } from 'knex';
import type { OutboundEvent } from '../../domain/entities/outbound-event.js';
import type { OutboundEventStatus } from '../../domain/enums/outbound-event-status.js';

interface EventRow {
  id: string;
  event_type: string;
  target_url: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  last_attempt_at: Date | null;
  last_error: string | null;
  next_retry_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: EventRow): OutboundEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    targetUrl: row.target_url,
    payload: row.payload,
    status: row.status as OutboundEventStatus,
    attempts: row.attempts,
    lastAttemptAt: row.last_attempt_at,
    lastError: row.last_error,
    nextRetryAt: row.next_retry_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class OutboundEventRepository {
  constructor(private db: Knex) {}

  async create(fields: Record<string, unknown>, trx?: Knex.Transaction): Promise<OutboundEvent> {
    const qb = trx || this.db;
    const [row] = await qb('outbound_events').insert(fields).returning('*');
    return toEntity(row);
  }

  async findPending(limit: number = 10): Promise<OutboundEvent[]> {
    const rows = await this.db('outbound_events')
      .where('status', 'PENDING')
      .where(function () {
        this.whereNull('next_retry_at').orWhere('next_retry_at', '<=', new Date());
      })
      .orderBy('created_at')
      .limit(limit);
    return rows.map(toEntity);
  }

  async markSent(id: string): Promise<void> {
    await this.db('outbound_events').where({ id }).update({
      status: 'SENT',
      last_attempt_at: new Date(),
      updated_at: new Date(),
    });
  }

  async markFailed(id: string, error: string, nextRetryAt: Date): Promise<void> {
    await this.db('outbound_events').where({ id }).update({
      status: 'PENDING',
      attempts: this.db.raw('attempts + 1'),
      last_attempt_at: new Date(),
      last_error: error,
      next_retry_at: nextRetryAt,
      updated_at: new Date(),
    });
  }

  async markDeadLetter(id: string, error: string): Promise<void> {
    await this.db('outbound_events').where({ id }).update({
      status: 'DEAD_LETTER',
      last_attempt_at: new Date(),
      last_error: error,
      updated_at: new Date(),
    });
  }
}
