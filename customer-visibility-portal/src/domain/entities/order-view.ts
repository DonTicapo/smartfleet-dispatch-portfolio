import type { OrderViewStatus } from '../enums/order-view-status.js';
import type { Quantity } from '../value-objects/quantity.js';

export interface OrderView {
  id: string;
  externalOrderId: string;
  customerId: string;
  jobName: string;
  siteName: string;
  mixDesignName: string;
  requestedQuantity: Quantity;
  requestedDeliveryDate: Date;
  status: OrderViewStatus;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
