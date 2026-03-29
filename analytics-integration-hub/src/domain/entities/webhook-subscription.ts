export interface WebhookSubscription {
  id: string;
  url: string;
  eventTypes: string[];
  secret: string;
  isActive: boolean;
  lastDeliveredAt: Date | null;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}
