import type { Knex } from 'knex';
import type { OrderView } from '../../domain/entities/order-view.js';
import type { OrderViewStatus } from '../../domain/enums/order-view-status.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { OrderViewRepository } from '../../infrastructure/repositories/order-view-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export interface UpsertOrderViewInput {
  externalOrderId: string;
  customerId: string;
  jobName: string;
  siteName: string;
  mixDesignName: string;
  requestedQuantity: { amount: number; unit: string };
  requestedDeliveryDate: Date;
  status: OrderViewStatus;
}

export interface ListOrdersFilter {
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export class OrderViewService {
  constructor(
    private db: Knex,
    private orderViewRepo: OrderViewRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async upsert(input: UpsertOrderViewInput, actor: string): Promise<OrderView> {
    return this.db.transaction(async (trx) => {
      const order = await this.orderViewRepo.upsert(
        {
          externalOrderId: input.externalOrderId,
          customerId: input.customerId,
          jobName: input.jobName,
          siteName: input.siteName,
          mixDesignName: input.mixDesignName,
          requestedQuantity: input.requestedQuantity,
          requestedDeliveryDate: input.requestedDeliveryDate,
          status: input.status,
          lastSyncedAt: new Date(),
        },
        trx,
      );

      await this.auditRepo.log(
        {
          entityType: 'OrderView',
          entityId: order.id,
          action: 'UPSERT',
          actor,
          changes: { externalOrderId: input.externalOrderId, status: input.status },
        },
        trx,
      );

      return order;
    });
  }

  async getById(id: string, customerId: string): Promise<OrderView> {
    const order = await this.orderViewRepo.findById(id);
    if (!order || order.customerId !== customerId) {
      throw new EntityNotFoundError('OrderView', id);
    }
    return order;
  }

  async listByCustomer(customerId: string, filters?: ListOrdersFilter): Promise<OrderView[]> {
    return this.orderViewRepo.listByCustomerId(customerId, filters);
  }
}
