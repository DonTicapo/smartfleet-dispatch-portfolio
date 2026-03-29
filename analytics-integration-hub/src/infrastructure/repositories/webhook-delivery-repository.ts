import type { Knex } from 'knex';
import type { WebhookDelivery } from '../../domain/entities/webhook-delivery.js';
import type { DeliveryStatus } from '../../domain/enums/delivery-status.js';

interface WebhookDeliveryRow {
  id: string;
  subscription_id: string;
  event_id: string;
  status: string;
  http_status: number | null;
  response_body: string | null;
  attempts: number;
  last_attempt_at: Date | null;
  created_at: Date;
}

function toEntity(row: WebhookDeliveryRow): WebhookDelivery {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    eventId: row.event_id,
    status: row.status as DeliveryStatus,
    httpStatus: row.http_status,
    responseBody: row.response_body,
    attempts: row.attempts,
    lastAttemptAt: row.last_attempt_at,
    createdAt: row.created_at,
  };
}

export class WebhookDeliveryRepository {
  constructor(private db: Knex) {}

  async create(
    data: { subscriptionId: string; eventId: string },
    trx?: Knex.Transaction,
  ): Promise<WebhookDelivery> {
    const qb = trx || this.db;
    const [row] = await qb('webhook_deliveries')
      .insert({
        subscription_id: data.subscriptionId,
        event_id: data.eventId,
        status: 'PENDING',
        attempts: 0,
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<WebhookDelivery | null> {
    const row = await this.db('webhook_deliveries').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findPendingByEventId(eventId: string): Promise<WebhookDelivery[]> {
    const rows = await this.db('webhook_deliveries')
      .where({ event_id: eventId, status: 'PENDING' });
    return rows.map(toEntity);
  }

  async findPending(limit: number = 100): Promise<WebhookDelivery[]> {
    const rows = await this.db('webhook_deliveries')
      .where({ status: 'PENDING' })
      .orderBy('created_at', 'asc')
      .limit(limit);
    return rows.map(toEntity);
  }

  async updateStatus(
    id: string,
    status: DeliveryStatus,
    extra: { httpStatus?: number; responseBody?: string; attempts?: number } = {},
    trx?: Knex.Transaction,
  ): Promise<WebhookDelivery | null> {
    const qb = trx || this.db;
    const updates: Record<string, unknown> = {
      status,
      last_attempt_at: new Date(),
    };
    if (extra.httpStatus !== undefined) updates.http_status = extra.httpStatus;
    if (extra.responseBody !== undefined) updates.response_body = extra.responseBody;
    if (extra.attempts !== undefined) updates.attempts = extra.attempts;

    const [row] = await qb('webhook_deliveries')
      .where({ id })
      .update(updates)
      .returning('*');
    return row ? toEntity(row) : null;
  }
}
