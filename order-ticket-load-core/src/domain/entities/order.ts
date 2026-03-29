import type { OrderStatus } from '../enums/order-status.js';
import type { Quantity } from '../value-objects/quantity.js';

export interface Order {
  id: string;
  externalId: string | null;
  customerId: string;
  jobId: string;
  mixDesignId: string;
  requestedQuantity: Quantity;
  requestedDeliveryDate: Date;
  requestedDeliveryTime: string | null;
  specialInstructions: string | null;
  status: OrderStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
