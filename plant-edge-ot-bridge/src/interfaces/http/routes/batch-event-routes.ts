import type { FastifyInstance } from 'fastify';
import { RecordBatchEventBody, BatchEventQueryParams } from '../schemas/batch-event-schemas.js';
import type { BatchEventService } from '../../../application/services/batch-event-service.js';
import type { BatchEventType } from '../../../domain/enums/batch-event-type.js';

export function registerBatchEventRoutes(app: FastifyInstance, service: BatchEventService): void {
  app.post('/edge/batch-events', async (request, reply) => {
    const body = RecordBatchEventBody.parse(request.body);
    const { event, created } = await service.record(
      {
        ...body,
        eventType: body.eventType as BatchEventType,
      },
      request.principal.sub,
    );
    reply.code(created ? 201 : 200).send(event);
  });

  app.get('/edge/batch-events', async (request) => {
    const params = BatchEventQueryParams.parse(request.query);
    return service.query({
      plantId: params.plantId,
      mixerId: params.mixerId,
      ticketNumber: params.ticketNumber,
      eventType: params.eventType as BatchEventType | undefined,
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? new Date(params.to) : undefined,
      limit: params.limit,
      offset: params.offset,
    });
  });

  app.get('/edge/batch-events/:eventId', async (request) => {
    const { eventId } = request.params as { eventId: string };
    return service.getByEventId(eventId);
  });
}
