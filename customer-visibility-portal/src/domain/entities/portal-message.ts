import type { MessageSeverity } from '../enums/message-severity.js';

export interface PortalMessage {
  id: string;
  customerId: string;
  orderId: string | null;
  subject: string;
  body: string;
  severity: MessageSeverity;
  isRead: boolean;
  createdBy: string;
  createdAt: Date;
}
