import type { OutboundTarget } from '../enums/outbound-target.js';
import type { OutboundStatus } from '../enums/outbound-status.js';

export interface OutboundEvent {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  targetService: OutboundTarget;
  status: OutboundStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: Date | null;
  nextRetryAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
}
