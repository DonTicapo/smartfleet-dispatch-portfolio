import type { DeliveryStatus } from '../enums/delivery-status.js';

export interface WebhookDelivery {
  id: string;
  subscriptionId: string;
  eventId: string;
  status: DeliveryStatus;
  httpStatus: number | null;
  responseBody: string | null;
  attempts: number;
  lastAttemptAt: Date | null;
  createdAt: Date;
}
