import type { LoadStatus } from '../enums/load-status.js';
import type { Quantity } from '../value-objects/quantity.js';

export interface Load {
  id: string;
  ticketId: string;
  loadNumber: number;
  truckId: string | null;
  driverId: string | null;
  mixDesignId: string;
  actualQuantity: Quantity | null;
  status: LoadStatus;
  batchedAt: Date | null;
  departedPlantAt: Date | null;
  arrivedSiteAt: Date | null;
  pourStartedAt: Date | null;
  pourCompletedAt: Date | null;
  returnedPlantAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
