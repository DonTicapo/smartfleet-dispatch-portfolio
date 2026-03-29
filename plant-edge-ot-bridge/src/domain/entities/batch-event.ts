import type { BatchEventType } from '../enums/batch-event-type.js';

export interface BatchEvent {
  id: string;
  eventId: string;
  plantId: string;
  mixerId: string;
  ticketNumber: string | null;
  batchNumber: string;
  eventType: BatchEventType;
  payload: Record<string, unknown>;
  occurredAt: Date;
  receivedAt: Date;
}
