import type { Knex } from 'knex';
import type { PortalMessage } from '../../domain/entities/portal-message.js';
import type { MessageSeverity } from '../../domain/enums/message-severity.js';

interface MessageRow {
  id: string;
  customer_id: string;
  order_id: string | null;
  subject: string;
  body: string;
  severity: string;
  is_read: boolean;
  created_by: string;
  created_at: Date;
}

function toEntity(row: MessageRow): PortalMessage {
  return {
    id: row.id,
    customerId: row.customer_id,
    orderId: row.order_id,
    subject: row.subject,
    body: row.body,
    severity: row.severity as MessageSeverity,
    isRead: row.is_read,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export class MessageRepository {
  constructor(private db: Knex) {}

  async create(
    data: Omit<PortalMessage, 'id' | 'createdAt'>,
    trx?: Knex.Transaction,
  ): Promise<PortalMessage> {
    const qb = trx || this.db;
    const [row] = await qb('portal_messages')
      .insert({
        customer_id: data.customerId,
        order_id: data.orderId,
        subject: data.subject,
        body: data.body,
        severity: data.severity,
        is_read: data.isRead,
        created_by: data.createdBy,
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<PortalMessage | null> {
    const row = await this.db('portal_messages').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async listByCustomerId(
    customerId: string,
    filters?: { unreadOnly?: boolean },
  ): Promise<PortalMessage[]> {
    let query = this.db('portal_messages').where({ customer_id: customerId });

    if (filters?.unreadOnly) {
      query = query.andWhere({ is_read: false });
    }

    const rows = await query.orderBy('created_at', 'desc');
    return rows.map(toEntity);
  }

  async markAsRead(id: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx || this.db;
    await qb('portal_messages').where({ id }).update({ is_read: true });
  }
}
