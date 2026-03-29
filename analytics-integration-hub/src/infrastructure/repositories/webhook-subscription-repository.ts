import type { Knex } from 'knex';
import type { WebhookSubscription } from '../../domain/entities/webhook-subscription.js';

interface WebhookSubscriptionRow {
  id: string;
  url: string;
  event_types: string[];
  secret: string;
  is_active: boolean;
  last_delivered_at: Date | null;
  failure_count: number;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: WebhookSubscriptionRow): WebhookSubscription {
  return {
    id: row.id,
    url: row.url,
    eventTypes: row.event_types,
    secret: row.secret,
    isActive: row.is_active,
    lastDeliveredAt: row.last_delivered_at,
    failureCount: row.failure_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class WebhookSubscriptionRepository {
  constructor(private db: Knex) {}

  async create(
    data: { url: string; eventTypes: string[]; secret: string },
    trx?: Knex.Transaction,
  ): Promise<WebhookSubscription> {
    const qb = trx || this.db;
    const [row] = await qb('webhook_subscriptions')
      .insert({
        url: data.url,
        event_types: data.eventTypes,
        secret: data.secret,
        is_active: true,
        failure_count: 0,
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<WebhookSubscription | null> {
    const row = await this.db('webhook_subscriptions').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async listActive(): Promise<WebhookSubscription[]> {
    const rows = await this.db('webhook_subscriptions')
      .where({ is_active: true })
      .orderBy('created_at', 'desc');
    return rows.map(toEntity);
  }

  async listAll(): Promise<WebhookSubscription[]> {
    const rows = await this.db('webhook_subscriptions')
      .orderBy('created_at', 'desc');
    return rows.map(toEntity);
  }

  async findByEventType(eventType: string): Promise<WebhookSubscription[]> {
    const rows = await this.db('webhook_subscriptions')
      .where({ is_active: true })
      .whereRaw('? = ANY(event_types)', [eventType]);
    return rows.map(toEntity);
  }

  async delete(id: string, trx?: Knex.Transaction): Promise<boolean> {
    const qb = trx || this.db;
    const count = await qb('webhook_subscriptions').where({ id }).delete();
    return count > 0;
  }

  async incrementFailureCount(id: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx || this.db;
    await qb('webhook_subscriptions')
      .where({ id })
      .increment('failure_count', 1)
      .update({ updated_at: new Date() });
  }

  async updateLastDelivered(id: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx || this.db;
    await qb('webhook_subscriptions')
      .where({ id })
      .update({
        last_delivered_at: new Date(),
        failure_count: 0,
        updated_at: new Date(),
      });
  }
}
