import type { OutboundEventStatus } from '../enums/outbound-event-status.js';

export interface OutboundEvent {
  id: string;
  eventType: string;
  targetUrl: string;
  payload: Record<string, unknown>;
  status: OutboundEventStatus;
  attempts: number;
  lastAttemptAt: Date | null;
  lastError: string | null;
  nextRetryAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
