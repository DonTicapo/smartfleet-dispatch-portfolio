import type { TruckStatus } from '../enums/truck-status.js';

export interface Truck {
  id: string;
  externalId: string | null;
  number: string;
  licensePlate: string | null;
  capacityAmount: number | null;
  capacityUnit: string;
  status: TruckStatus;
  homePlantId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
