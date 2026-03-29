import type { TicketViewStatus } from '../enums/ticket-view-status.js';

export interface TicketView {
  id: string;
  externalTicketId: string;
  orderId: string;
  ticketNumber: string;
  status: TicketViewStatus;
  scheduledDate: Date;
  plantId: string | null;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
