import type { OrderStatus, UnitOfMeasure } from './enums.js';

export interface OrderDto {
  id: string;
  externalId: string | null;
  customerId: string;
  jobId: string;
  mixDesignId: string;
  requestedQuantity: QuantityDto;
  requestedDeliveryDate: string;
  requestedDeliveryTime: string | null;
  specialInstructions: string | null;
  status: OrderStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuantityDto {
  amount: number;
  unit: UnitOfMeasure;
}
