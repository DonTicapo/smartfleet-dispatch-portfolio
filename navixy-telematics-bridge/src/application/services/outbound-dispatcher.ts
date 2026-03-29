interface Logger {
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}
import type { OutboundEventRepository } from '../../infrastructure/repositories/outbound-event-repository.js';
import type { OtlCoreClient } from '../../infrastructure/otl-core/otl-core-client.js';

export class OutboundDispatcher {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private outboundRepo: OutboundEventRepository,
    private otlCoreClient: OtlCoreClient,
    private maxAttempts: number,
    private pollIntervalMs: number,
    private logger: Logger,
  ) {}

  start(): void {
    this.logger.info({ pollIntervalMs: this.pollIntervalMs }, 'Outbound dispatcher started');
    this.intervalId = setInterval(() => this.processQueue(), this.pollIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.info('Outbound dispatcher stopped');
    }
  }

  async processQueue(): Promise<void> {
    try {
      const events = await this.outboundRepo.findPending(10);
      for (const event of events) {
        await this.processOne(event.id, event.payload, event.targetUrl, event.attempts);
      }
    } catch (err) {
      this.logger.error({ error: (err as Error).message }, 'Outbound dispatcher queue error');
    }
  }

  private async processOne(
    id: string,
    payload: Record<string, unknown>,
    _targetUrl: string,
    attempts: number,
  ): Promise<void> {
    try {
      await this.otlCoreClient.recordDeliveryEvent(payload as {
        eventId: string;
        loadId: string;
        state: string;
        occurredAt: string;
        source: string;
        sourceEventId?: string | null;
        payload?: Record<string, unknown> | null;
      });
      await this.outboundRepo.markSent(id);
      this.logger.info({ eventId: id }, 'Outbound event sent');
    } catch (err) {
      const errorMsg = (err as Error).message;
      if (attempts + 1 >= this.maxAttempts) {
        await this.outboundRepo.markDeadLetter(id, errorMsg);
        this.logger.error({ eventId: id, error: errorMsg }, 'Outbound event dead-lettered');
      } else {
        const delay = Math.pow(2, attempts + 1) * 1000;
        const nextRetry = new Date(Date.now() + delay);
        await this.outboundRepo.markFailed(id, errorMsg, nextRetry);
        this.logger.warn({ eventId: id, nextRetry, error: errorMsg }, 'Outbound event failed, will retry');
      }
    }
  }
}
