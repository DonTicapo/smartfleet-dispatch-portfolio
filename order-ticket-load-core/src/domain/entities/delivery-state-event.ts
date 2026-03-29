import type { DeliveryState } from '../enums/delivery-state.js';

export interface DeliveryStateEvent {
  id: string;
  eventId: string;
  loadId: string;
  state: DeliveryState;
  occurredAt: Date;
  source: string;
  sourceEventId: string | null;
  payload: Record<string, unknown> | null;
  receivedAt: Date;
}
