import type { Knex } from 'knex';
import type { IngestEvent } from '../../domain/entities/ingest-event.js';
import type { EventSource } from '../../domain/enums/event-source.js';
import { DeliveryStatus } from '../../domain/enums/delivery-status.js';
import type { IngestEventRepository } from '../../infrastructure/repositories/ingest-event-repository.js';
import type { WebhookSubscriptionRepository } from '../../infrastructure/repositories/webhook-subscription-repository.js';
import type { WebhookDeliveryRepository } from '../../infrastructure/repositories/webhook-delivery-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';
import { dispatchWebhook } from '../../infrastructure/clients/webhook-dispatcher.js';
import type { WebhookPayload } from '../../infrastructure/clients/webhook-dispatcher.js';

export interface IngestEventInput {
  eventId: string;
  source: EventSource;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export interface IngestResult {
  event: IngestEvent;
  isNew: boolean;
  webhooksTriggered: number;
}

export class EventIngestionService {
  constructor(
    private db: Knex,
    private eventRepo: IngestEventRepository,
    private webhookSubRepo: WebhookSubscriptionRepository,
    private webhookDeliveryRepo: WebhookDeliveryRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async ingest(input: IngestEventInput, actor: string): Promise<IngestResult> {
    return this.db.transaction(async (trx) => {
      // 1. Insert event idempotently
      const { event, isNew } = await this.eventRepo.insertIdempotent(
        {
          eventId: input.eventId,
          source: input.source,
          eventType: input.eventType,
          aggregateType: input.aggregateType,
          aggregateId: input.aggregateId,
          payload: input.payload,
          occurredAt: input.occurredAt,
        },
        trx,
      );

      if (!isNew) {
        return { event, isNew: false, webhooksTriggered: 0 };
      }

      // 2. Audit the ingestion
      await this.auditRepo.log(
        {
          entityType: 'IngestEvent',
          entityId: event.id,
          action: 'INGEST',
          actor,
          changes: { eventId: input.eventId, source: input.source, eventType: input.eventType },
        },
        trx,
      );

      // 3. Find matching webhook subscriptions
      const subscriptions = await this.webhookSubRepo.findByEventType(input.eventType);

      // 4. Create webhook delivery records and dispatch
      let webhooksTriggered = 0;
      for (const sub of subscriptions) {
        const delivery = await this.webhookDeliveryRepo.create(
          { subscriptionId: sub.id, eventId: input.eventId },
          trx,
        );
        webhooksTriggered++;

        // Fire-and-forget webhook dispatch (outside transaction)
        // We queue them up and dispatch after commit
        const webhookPayload: WebhookPayload = {
          eventId: event.eventId,
          eventType: event.eventType,
          source: event.source,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event.payload,
          occurredAt: event.occurredAt.toISOString(),
        };

        // Dispatch in background (non-blocking for the transaction)
        setImmediate(async () => {
          try {
            const result = await dispatchWebhook(sub.url, webhookPayload, sub.secret);
            if (result.success) {
              await this.webhookDeliveryRepo.updateStatus(
                delivery.id,
                DeliveryStatus.DELIVERED,
                {
                  httpStatus: result.httpStatus ?? undefined,
                  responseBody: result.responseBody ?? undefined,
                  attempts: 1,
                },
              );
              await this.webhookSubRepo.updateLastDelivered(sub.id);
            } else {
              await this.webhookDeliveryRepo.updateStatus(
                delivery.id,
                DeliveryStatus.FAILED,
                {
                  httpStatus: result.httpStatus ?? undefined,
                  responseBody: result.responseBody ?? undefined,
                  attempts: 1,
                },
              );
              await this.webhookSubRepo.incrementFailureCount(sub.id);
            }
          } catch {
            // Best-effort delivery — failures are tracked in delivery records
            await this.webhookDeliveryRepo.updateStatus(
              delivery.id,
              DeliveryStatus.FAILED,
              { attempts: 1, responseBody: 'Dispatch error' },
            ).catch(() => {});
            await this.webhookSubRepo.incrementFailureCount(sub.id).catch(() => {});
          }
        });
      }

      return { event, isNew: true, webhooksTriggered };
    });
  }
}
