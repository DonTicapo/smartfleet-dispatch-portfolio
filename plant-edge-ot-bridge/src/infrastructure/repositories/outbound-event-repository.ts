import type { Knex } from 'knex';
import type { OutboundEvent } from '../../domain/entities/outbound-event.js';
import type { OutboundTarget } from '../../domain/enums/outbound-target.js';
import type { OutboundStatus } from '../../domain/enums/outbound-status.js';

interface OutboundEventRow {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  target_service: string;
  status: string;
  attempts: number;
  max_attempts: number;
  last_attempt_at: Date | null;
  next_retry_at: Date | null;
  sent_at: Date | null;
  created_at: Date;
}

function toEntity(row: OutboundEventRow): OutboundEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    payload: row.payload,
    targetService: row.target_service as OutboundTarget,
    status: row.status as OutboundStatus,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    lastAttemptAt: row.last_attempt_at,
    nextRetryAt: row.next_retry_at,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  };
}

export class OutboundEventRepository {
  constructor(private db: Knex) {}

  async create(
    data: Omit<OutboundEvent, 'id' | 'createdAt'>,
    trx?: Knex.Transaction,
  ): Promise<OutboundEvent> {
    const qb = trx || this.db;
    const [row] = await qb('outbound_events')
      .insert({
        event_type: data.eventType,
        payload: JSON.stringify(data.payload),
        target_service: data.targetService,
        status: data.status,
        attempts: data.attempts,
        max_attempts: data.maxAttempts,
        last_attempt_at: data.lastAttemptAt,
        next_retry_at: data.nextRetryAt,
        sent_at: data.sentAt,
      })
      .returning('*');
    return toEntity(row);
  }

  async findPending(now: Date): Promise<OutboundEvent[]> {
    const rows = await this.db('outbound_events')
      .where({ status: 'PENDING' })
      .where(function () {
        this.whereNull('next_retry_at').orWhere('next_retry_at', '<=', now);
      })
      .orderBy('created_at', 'asc');
    return rows.map(toEntity);
  }

  async findFailed(now: Date): Promise<OutboundEvent[]> {
    const rows = await this.db('outbound_events')
      .where({ status: 'FAILED' })
      .where('next_retry_at', '<=', now)
      .orderBy('created_at', 'asc');
    return rows.map(toEntity);
  }

  async findAll(filters?: { status?: OutboundStatus; limit?: number; offset?: number }): Promise<OutboundEvent[]> {
    let query = this.db('outbound_events').orderBy('created_at', 'desc');
    if (filters?.status) query = query.where({ status: filters.status });
    const limit = filters?.limit ?? 100;
    const offset = filters?.offset ?? 0;
    query = query.limit(limit).offset(offset);
    const rows = await query;
    return rows.map(toEntity);
  }

  async markSent(id: string, trx?: Knex.Transaction): Promise<OutboundEvent> {
    const qb = trx || this.db;
    const now = new Date();
    const [row] = await qb('outbound_events')
      .where({ id })
      .update({
        status: 'SENT',
        sent_at: now,
        last_attempt_at: now,
        attempts: this.db.raw('attempts + 1'),
      })
      .returning('*');
    return toEntity(row);
  }

  async markFailed(id: string, nextRetryAt: Date, trx?: Knex.Transaction): Promise<OutboundEvent> {
    const qb = trx || this.db;
    const [row] = await qb('outbound_events')
      .where({ id })
      .update({
        status: 'FAILED',
        last_attempt_at: new Date(),
        next_retry_at: nextRetryAt,
        attempts: this.db.raw('attempts + 1'),
      })
      .returning('*');
    return toEntity(row);
  }

  async markDeadLetter(id: string, trx?: Knex.Transaction): Promise<OutboundEvent> {
    const qb = trx || this.db;
    const [row] = await qb('outbound_events')
      .where({ id })
      .update({
        status: 'DEAD_LETTER',
        last_attempt_at: new Date(),
        attempts: this.db.raw('attempts + 1'),
      })
      .returning('*');
    return toEntity(row);
  }

  async countByStatus(): Promise<Record<string, number>> {
    const rows = await this.db('outbound_events')
      .select('status')
      .count('* as count')
      .groupBy('status');
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.status as string] = Number(row.count);
    }
    return result;
  }
}
