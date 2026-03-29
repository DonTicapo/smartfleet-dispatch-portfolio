import type { TicketStatus } from '../enums/ticket-status.js';

export interface Ticket {
  id: string;
  orderId: string;
  ticketNumber: string;
  status: TicketStatus;
  scheduledDate: Date;
  plantId: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
