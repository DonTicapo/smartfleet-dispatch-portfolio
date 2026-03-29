import type { LoadStatus } from './enums.js';
import type { QuantityDto } from './order.js';
import type { DeliveryStateEventDto } from './delivery-state-event.js';

export interface LoadDto {
  id: string;
  ticketId: string;
  loadNumber: number;
  truckId: string | null;
  driverId: string | null;
  mixDesignId: string;
  actualQuantity: QuantityDto | null;
  status: LoadStatus;
  batchedAt: string | null;
  departedPlantAt: string | null;
  arrivedSiteAt: string | null;
  pourStartedAt: string | null;
  pourCompletedAt: string | null;
  returnedPlantAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoadDetailDto extends LoadDto {
  events: DeliveryStateEventDto[];
}
