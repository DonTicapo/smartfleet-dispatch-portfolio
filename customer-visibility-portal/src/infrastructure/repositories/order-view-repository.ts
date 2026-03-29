import type { Knex } from 'knex';
import type { OrderView } from '../../domain/entities/order-view.js';
import type { OrderViewStatus } from '../../domain/enums/order-view-status.js';

interface OrderViewRow {
  id: string;
  external_order_id: string;
  customer_id: string;
  job_name: string;
  site_name: string;
  mix_design_name: string;
  requested_quantity_amount: string;
  requested_quantity_unit: string;
  requested_delivery_date: Date;
  status: string;
  last_synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: OrderViewRow): OrderView {
  return {
    id: row.id,
    externalOrderId: row.external_order_id,
    customerId: row.customer_id,
    jobName: row.job_name,
    siteName: row.site_name,
    mixDesignName: row.mix_design_name,
    requestedQuantity: {
      amount: parseFloat(row.requested_quantity_amount),
      unit: row.requested_quantity_unit,
    },
    requestedDeliveryDate: row.requested_delivery_date,
    status: row.status as OrderViewStatus,
    lastSyncedAt: row.last_synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class OrderViewRepository {
  constructor(private db: Knex) {}

  async upsert(
    data: Omit<OrderView, 'id' | 'createdAt' | 'updatedAt'>,
    trx?: Knex.Transaction,
  ): Promise<OrderView> {
    const qb = trx || this.db;
    const insertData = {
      external_order_id: data.externalOrderId,
      customer_id: data.customerId,
      job_name: data.jobName,
      site_name: data.siteName,
      mix_design_name: data.mixDesignName,
      requested_quantity_amount: data.requestedQuantity.amount,
      requested_quantity_unit: data.requestedQuantity.unit,
      requested_delivery_date: data.requestedDeliveryDate,
      status: data.status,
      last_synced_at: data.lastSyncedAt,
    };

    const [row] = await qb('order_views')
      .insert(insertData)
      .onConflict('external_order_id')
      .merge({
        ...insertData,
        updated_at: new Date(),
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<OrderView | null> {
    const row = await this.db('order_views').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findByExternalId(externalOrderId: string): Promise<OrderView | null> {
    const row = await this.db('order_views').where({ external_order_id: externalOrderId }).first();
    return row ? toEntity(row) : null;
  }

  async listByCustomerId(
    customerId: string,
    filters?: { status?: string; fromDate?: string; toDate?: string },
  ): Promise<OrderView[]> {
    let query = this.db('order_views').where({ customer_id: customerId });

    if (filters?.status) {
      query = query.andWhere({ status: filters.status });
    }
    if (filters?.fromDate) {
      query = query.andWhere('requested_delivery_date', '>=', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.andWhere('requested_delivery_date', '<=', filters.toDate);
    }

    const rows = await query.orderBy('requested_delivery_date', 'desc');
    return rows.map(toEntity);
  }

  async updateStatus(
    id: string,
    status: OrderViewStatus,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const qb = trx || this.db;
    await qb('order_views').where({ id }).update({ status, updated_at: new Date() });
  }
}
