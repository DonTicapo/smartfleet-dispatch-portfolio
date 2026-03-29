import type { FastifyInstance } from 'fastify';
import { CreateWebhookBody } from '../schemas/webhook-schemas.js';
import type { WebhookService } from '../../../application/services/webhook-service.js';

export function registerWebhookRoutes(app: FastifyInstance, service: WebhookService): void {
  app.post('/integrations/webhooks', async (request, reply) => {
    const body = CreateWebhookBody.parse(request.body);
    const subscription = await service.createSubscription(body, request.principal.sub);
    reply.code(201).send(subscription);
  });

  app.get('/integrations/webhooks', async () => {
    const subscriptions = await service.listSubscriptions();
    return { data: subscriptions, count: subscriptions.length };
  });

  app.delete('/integrations/webhooks/:webhookId', async (request, reply) => {
    const { webhookId } = request.params as { webhookId: string };
    await service.deleteSubscription(webhookId, request.principal.sub);
    reply.code(204).send();
  });
}
