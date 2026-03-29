import type { Knex } from 'knex';
import type { Order } from '../../domain/entities/order.js';
import { OrderStatus } from '../../domain/enums/order-status.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { OrderRepository } from '../../infrastructure/repositories/order-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';
import type { Quantity } from '../../domain/value-objects/quantity.js';

export interface CreateOrderInput {
  externalId?: string | null;
  customerId: string;
  jobId: string;
  mixDesignId: string;
  requestedQuantity: Quantity;
  requestedDeliveryDate: Date;
  requestedDeliveryTime?: string | null;
  specialInstructions?: string | null;
}

export class OrderService {
  constructor(
    private db: Knex,
    private orderRepo: OrderRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async create(input: CreateOrderInput, actor: string): Promise<Order> {
    return this.db.transaction(async (trx) => {
      const order = await this.orderRepo.create(
        {
          externalId: input.externalId ?? null,
          customerId: input.customerId,
          jobId: input.jobId,
          mixDesignId: input.mixDesignId,
          requestedQuantity: input.requestedQuantity,
          requestedDeliveryDate: input.requestedDeliveryDate,
          requestedDeliveryTime: input.requestedDeliveryTime ?? null,
          specialInstructions: input.specialInstructions ?? null,
          status: OrderStatus.DRAFT,
          createdBy: actor,
        },
        trx,
      );

      await this.auditRepo.log(
        {
          entityType: 'Order',
          entityId: order.id,
          action: 'CREATE',
          actor,
        },
        trx,
      );

      return order;
    });
  }

  async getById(id: string): Promise<Order> {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new EntityNotFoundError('Order', id);
    return order;
  }
}
