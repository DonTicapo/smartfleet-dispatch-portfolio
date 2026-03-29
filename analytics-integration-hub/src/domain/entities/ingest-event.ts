import type { EventSource } from '../enums/event-source.js';

export interface IngestEvent {
  id: string;
  eventId: string;
  source: EventSource;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  receivedAt: Date;
  processedAt: Date | null;
}
