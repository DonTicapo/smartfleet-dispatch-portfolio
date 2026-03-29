import type { DeliveryState } from './enums.js';

export interface DeliveryStateEventDto {
  id: string;
  eventId: string;
  loadId: string;
  state: DeliveryState;
  occurredAt: string;
  source: string;
  sourceEventId: string | null;
  payload: Record<string, unknown> | null;
  receivedAt: string;
}
