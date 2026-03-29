import type { OrderStatus, TicketStatus, LoadStatus, DeliveryState } from '../types/enums.js';

export type OtlDomainEvent =
  | { type: 'ORDER_CREATED'; payload: { orderId: string; customerId: string; jobId: string } }
  | {
      type: 'ORDER_STATUS_CHANGED';
      payload: { orderId: string; from: OrderStatus; to: OrderStatus };
    }
  | { type: 'TICKET_CREATED'; payload: { ticketId: string; orderId: string } }
  | {
      type: 'TICKET_STATUS_CHANGED';
      payload: { ticketId: string; from: TicketStatus; to: TicketStatus };
    }
  | { type: 'LOAD_CREATED'; payload: { loadId: string; ticketId: string } }
  | {
      type: 'LOAD_STATUS_CHANGED';
      payload: { loadId: string; from: LoadStatus; to: LoadStatus; triggeredBy?: string };
    }
  | {
      type: 'DELIVERY_STATE_RECORDED';
      payload: { eventId: string; loadId: string; state: DeliveryState; occurredAt: string };
    };
