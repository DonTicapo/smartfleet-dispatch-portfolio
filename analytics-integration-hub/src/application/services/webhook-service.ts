import type { Knex } from 'knex';
import type { WebhookSubscription } from '../../domain/entities/webhook-subscription.js';
import { DeliveryStatus } from '../../domain/enums/delivery-status.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { WebhookSubscriptionRepository } from '../../infrastructure/repositories/webhook-subscription-repository.js';
import type { WebhookDeliveryRepository } from '../../infrastructure/repositories/webhook-delivery-repository.js';
import type { IngestEventRepository } from '../../infrastructure/repositories/ingest-event-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';
import { dispatchWebhook } from '../../infrastructure/clients/webhook-dispatcher.js';
import type { WebhookPayload } from '../../infrastructure/clients/webhook-dispatcher.js';
import { randomBytes } from 'crypto';

export interface CreateWebhookInput {
  url: string;
  eventTypes: string[];
  secret?: string;
}

export class WebhookService {
  constructor(
    private db: Knex,
    private subscriptionRepo: WebhookSubscriptionRepository,
    private deliveryRepo: WebhookDeliveryRepository,
    private eventRepo: IngestEventRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async createSubscription(input: CreateWebhookInput, actor: string): Promise<WebhookSubscription> {
    return this.db.transaction(async (trx) => {
      const secret = input.secret || randomBytes(32).toString('hex');

      const subscription = await this.subscriptionRepo.create(
        {
          url: input.url,
          eventTypes: input.eventTypes,
          secret,
        },
        trx,
      );

      await this.auditRepo.log(
        {
          entityType: 'WebhookSubscription',
          entityId: subscription.id,
          action: 'CREATE',
          actor,
          changes: { url: input.url, eventTypes: input.eventTypes },
        },
        trx,
      );

      return subscription;
    });
  }

  async listSubscriptions(): Promise<WebhookSubscription[]> {
    return this.subscriptionRepo.listAll();
  }

  async deleteSubscription(id: string, actor: string): Promise<void> {
    return this.db.transaction(async (trx) => {
      const existing = await this.subscriptionRepo.findById(id);
      if (!existing) throw new EntityNotFoundError('WebhookSubscription', id);

      const deleted = await this.subscriptionRepo.delete(id, trx);
      if (!deleted) throw new EntityNotFoundError('WebhookSubscription', id);

      await this.auditRepo.log(
        {
          entityType: 'WebhookSubscription',
          entityId: id,
          action: 'DELETE',
          actor,
          changes: { url: existing.url },
        },
        trx,
      );
    });
  }

  async retryFailedDeliveries(): Promise<{ retried: number; succeeded: number }> {
    const pending = await this.deliveryRepo.findPending(100);
    let retried = 0;
    let succeeded = 0;

    for (const delivery of pending) {
      if (delivery.attempts >= 3) {
        // Max retries exceeded — mark as permanently failed
        await this.deliveryRepo.updateStatus(delivery.id, DeliveryStatus.FAILED, {
          attempts: delivery.attempts,
          responseBody: 'Max retries exceeded',
        });
        continue;
      }

      const subscription = await this.subscriptionRepo.findById(delivery.subscriptionId);
      if (!subscription || !subscription.isActive) continue;

      const event = await this.eventRepo.findByEventId(delivery.eventId);
      if (!event) continue;

      retried++;

      const payload: WebhookPayload = {
        eventId: event.eventId,
        eventType: event.eventType,
        source: event.source,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: event.payload,
        occurredAt: event.occurredAt.toISOString(),
      };

      const result = await dispatchWebhook(subscription.url, payload, subscription.secret);

      if (result.success) {
        await this.deliveryRepo.updateStatus(delivery.id, DeliveryStatus.DELIVERED, {
          httpStatus: result.httpStatus ?? undefined,
          responseBody: result.responseBody ?? undefined,
          attempts: delivery.attempts + 1,
        });
        await this.subscriptionRepo.updateLastDelivered(subscription.id);
        succeeded++;
      } else {
        await this.deliveryRepo.updateStatus(delivery.id, DeliveryStatus.FAILED, {
          httpStatus: result.httpStatus ?? undefined,
          responseBody: result.responseBody ?? undefined,
          attempts: delivery.attempts + 1,
        });
        await this.subscriptionRepo.incrementFailureCount(subscription.id);
      }
    }

    return { retried, succeeded };
  }
}
