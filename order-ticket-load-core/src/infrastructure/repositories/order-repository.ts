import type { Knex } from 'knex';
import type { Order } from '../../domain/entities/order.js';
import type { OrderStatus } from '../../domain/enums/order-status.js';
import type { UnitOfMeasure } from '../../domain/enums/unit-of-measure.js';

interface OrderRow {
  id: string;
  external_id: string | null;
  customer_id: string;
  job_id: string;
  mix_design_id: string;
  requested_quantity_amount: string;
  requested_quantity_unit: string;
  requested_delivery_date: Date;
  requested_delivery_time: string | null;
  special_instructions: string | null;
  status: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: OrderRow): Order {
  return {
    id: row.id,
    externalId: row.external_id,
    customerId: row.customer_id,
    jobId: row.job_id,
    mixDesignId: row.mix_design_id,
    requestedQuantity: {
      amount: parseFloat(row.requested_quantity_amount),
      unit: row.requested_quantity_unit as UnitOfMeasure,
    },
    requestedDeliveryDate: row.requested_delivery_date,
    requestedDeliveryTime: row.requested_delivery_time,
    specialInstructions: row.special_instructions,
    status: row.status as OrderStatus,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class OrderRepository {
  constructor(private db: Knex) {}

  async create(
    data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
    trx?: Knex.Transaction,
  ): Promise<Order> {
    const qb = trx || this.db;
    const [row] = await qb('orders')
      .insert({
        external_id: data.externalId,
        customer_id: data.customerId,
        job_id: data.jobId,
        mix_design_id: data.mixDesignId,
        requested_quantity_amount: data.requestedQuantity.amount,
        requested_quantity_unit: data.requestedQuantity.unit,
        requested_delivery_date: data.requestedDeliveryDate,
        requested_delivery_time: data.requestedDeliveryTime,
        special_instructions: data.specialInstructions,
        status: data.status,
        created_by: data.createdBy,
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.db('orders').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async updateStatus(id: string, status: OrderStatus, trx?: Knex.Transaction): Promise<void> {
    const qb = trx || this.db;
    await qb('orders').where({ id }).update({ status, updated_at: new Date() });
  }
}
