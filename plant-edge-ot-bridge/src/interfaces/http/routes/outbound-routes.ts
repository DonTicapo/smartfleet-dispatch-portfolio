import type { FastifyInstance } from 'fastify';
import { OutboundQueueParams } from '../schemas/outbound-schemas.js';
import type { OutboundService } from '../../../application/services/outbound-service.js';
import type { OutboundStatus } from '../../../domain/enums/outbound-status.js';

export function registerOutboundRoutes(app: FastifyInstance, service: OutboundService): void {
  app.get('/edge/outbound/queue', async (request) => {
    const params = OutboundQueueParams.parse(request.query);
    const events = await service.getQueue({
      status: params.status as OutboundStatus | undefined,
      limit: params.limit,
      offset: params.offset,
    });
    const summary = await service.getQueueSummary();
    return { events, summary };
  });

  app.post('/edge/outbound/flush', async (request, reply) => {
    const result = await service.flush(request.principal.sub);
    reply.code(200).send(result);
  });
}
