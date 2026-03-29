import type { Knex } from 'knex';
import type { OutboundEvent } from '../../domain/entities/outbound-event.js';
import { OutboundStatus } from '../../domain/enums/outbound-status.js';
import type { OutboundEventRepository } from '../../infrastructure/repositories/outbound-event-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

/** Exponential backoff delays in milliseconds: 5s, 30s, 2min, 10min, 1hr */
const RETRY_DELAYS_MS = [5_000, 30_000, 120_000, 600_000, 3_600_000];

function getNextRetryAt(attempts: number): Date {
  const delayIndex = Math.min(attempts, RETRY_DELAYS_MS.length - 1);
  const delayMs = RETRY_DELAYS_MS[delayIndex];
  return new Date(Date.now() + delayMs);
}

export class OutboundService {
  constructor(
    private db: Knex,
    private outboundRepo: OutboundEventRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  /**
   * Get all pending and retryable outbound events.
   */
  async getQueue(filters?: { status?: OutboundStatus; limit?: number; offset?: number }): Promise<OutboundEvent[]> {
    return this.outboundRepo.findAll(filters);
  }

  async getQueueSummary(): Promise<Record<string, number>> {
    return this.outboundRepo.countByStatus();
  }

  /**
   * Flush: process all pending and retryable events.
   * In a real edge system, this would POST to cloud services.
   * Here we simulate the send and manage retry/dead-letter logic.
   */
  async flush(actor: string): Promise<{ processed: number; sent: number; failed: number; deadLettered: number }> {
    const now = new Date();
    const pending = await this.outboundRepo.findPending(now);
    const failed = await this.outboundRepo.findFailed(now);
    const events = [...pending, ...failed];

    let sent = 0;
    let failedCount = 0;
    let deadLettered = 0;

    for (const event of events) {
      try {
        // Simulate sending — in production this would be an HTTP POST
        // to the target service URL based on event.targetService
        const success = await this.simulateSend(event);

        if (success) {
          await this.outboundRepo.markSent(event.id);
          sent++;

          await this.auditRepo.log({
            entityType: 'OutboundEvent',
            entityId: event.id,
            action: 'SENT',
            actor,
            changes: { targetService: event.targetService, eventType: event.eventType },
          });
        } else {
          throw new Error('Send failed');
        }
      } catch {
        const currentAttempts = event.attempts + 1;

        if (currentAttempts >= event.maxAttempts) {
          await this.outboundRepo.markDeadLetter(event.id);
          deadLettered++;

          await this.auditRepo.log({
            entityType: 'OutboundEvent',
            entityId: event.id,
            action: 'DEAD_LETTER',
            actor,
            changes: {
              targetService: event.targetService,
              eventType: event.eventType,
              attempts: currentAttempts,
            },
          });
        } else {
          const nextRetry = getNextRetryAt(currentAttempts);
          await this.outboundRepo.markFailed(event.id, nextRetry);
          failedCount++;

          await this.auditRepo.log({
            entityType: 'OutboundEvent',
            entityId: event.id,
            action: 'RETRY_SCHEDULED',
            actor,
            changes: {
              targetService: event.targetService,
              eventType: event.eventType,
              attempts: currentAttempts,
              nextRetryAt: nextRetry.toISOString(),
            },
          });
        }
      }
    }

    return { processed: events.length, sent, failed: failedCount, deadLettered };
  }

  /**
   * Simulate sending to target service.
   * In production, replace with actual HTTP client calls.
   * Returns true for success, throws on failure.
   */
  private async simulateSend(_event: OutboundEvent): Promise<boolean> {
    // In edge deployment, this would:
    // - POST to OTL_CORE at its configured URL
    // - POST to ANALYTICS_HUB at its configured URL
    // For portfolio purposes, always succeeds.
    return true;
  }
}
