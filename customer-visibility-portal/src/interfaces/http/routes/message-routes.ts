import type { FastifyInstance } from 'fastify';
import { MessageIdParam, ListMessagesQuery } from '../schemas/message-schemas.js';
import type { MessageService } from '../../../application/services/message-service.js';

export function registerMessageRoutes(
  app: FastifyInstance,
  messageService: MessageService,
): void {
  app.get('/portal/messages', async (request) => {
    const query = ListMessagesQuery.parse(request.query);
    const { customerId } = request.principal;
    return messageService.listByCustomer(customerId, {
      unreadOnly: query.unreadOnly,
    });
  });

  app.post('/portal/messages/:messageId/read', async (request, reply) => {
    const { messageId } = MessageIdParam.parse(request.params);
    const { customerId, sub } = request.principal;
    await messageService.markAsRead(messageId, customerId, sub);
    reply.code(204).send();
  });
}
