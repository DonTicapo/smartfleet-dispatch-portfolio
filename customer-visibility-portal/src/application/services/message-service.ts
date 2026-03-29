import type { Knex } from 'knex';
import type { PortalMessage } from '../../domain/entities/portal-message.js';
import type { MessageSeverity } from '../../domain/enums/message-severity.js';
import { EntityNotFoundError, AuthorizationError } from '../../domain/errors/domain-error.js';
import type { MessageRepository } from '../../infrastructure/repositories/message-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export interface CreateMessageInput {
  customerId: string;
  orderId?: string | null;
  subject: string;
  body: string;
  severity: MessageSeverity;
}

export class MessageService {
  constructor(
    private db: Knex,
    private messageRepo: MessageRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async create(input: CreateMessageInput, actor: string): Promise<PortalMessage> {
    return this.db.transaction(async (trx) => {
      const message = await this.messageRepo.create(
        {
          customerId: input.customerId,
          orderId: input.orderId ?? null,
          subject: input.subject,
          body: input.body,
          severity: input.severity,
          isRead: false,
          createdBy: actor,
        },
        trx,
      );

      await this.auditRepo.log(
        {
          entityType: 'PortalMessage',
          entityId: message.id,
          action: 'CREATE',
          actor,
          changes: { subject: input.subject, severity: input.severity },
        },
        trx,
      );

      return message;
    });
  }

  async listByCustomer(
    customerId: string,
    filters?: { unreadOnly?: boolean },
  ): Promise<PortalMessage[]> {
    return this.messageRepo.listByCustomerId(customerId, filters);
  }

  async markAsRead(messageId: string, customerId: string, actor: string): Promise<void> {
    const message = await this.messageRepo.findById(messageId);
    if (!message) throw new EntityNotFoundError('PortalMessage', messageId);

    // Ensure the message belongs to the authenticated customer
    if (message.customerId !== customerId) {
      throw new AuthorizationError('Cannot access messages for another customer');
    }

    await this.db.transaction(async (trx) => {
      await this.messageRepo.markAsRead(messageId, trx);
      await this.auditRepo.log(
        {
          entityType: 'PortalMessage',
          entityId: messageId,
          action: 'MARK_READ',
          actor,
        },
        trx,
      );
    });
  }
}
