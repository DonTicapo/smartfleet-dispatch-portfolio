import type { TicketStatus } from './enums.js';
import type { LoadDto } from './load.js';

export interface TicketDto {
  id: string;
  orderId: string;
  ticketNumber: string;
  status: TicketStatus;
  scheduledDate: string;
  plantId: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetailDto extends TicketDto {
  loads: LoadDto[];
}
