import type { FastifyInstance } from 'fastify';
import { IngestEventBody, EventQueryParams } from '../schemas/event-schemas.js';
import type { EventIngestionService } from '../../../application/services/event-ingestion-service.js';
import type { EventQueryService } from '../../../application/services/event-query-service.js';

export function registerEventRoutes(
  app: FastifyInstance,
  ingestionService: EventIngestionService,
  queryService: EventQueryService,
): void {
  app.post('/events', async (request, reply) => {
    const body = IngestEventBody.parse(request.body);
    const result = await ingestionService.ingest(body, request.principal.sub);

    if (result.isNew) {
      reply.code(201).send({
        event: result.event,
        isNew: true,
        webhooksTriggered: result.webhooksTriggered,
      });
    } else {
      reply.code(200).send({
        event: result.event,
        isNew: false,
        webhooksTriggered: 0,
      });
    }
  });

  app.get('/events', async (request) => {
    const params = EventQueryParams.parse(request.query);
    const events = await queryService.query(params);
    return { data: events, count: events.length };
  });

  app.get('/events/:eventId', async (request) => {
    const { eventId } = request.params as { eventId: string };
    return queryService.getByEventId(eventId);
  });

  app.post('/events/:eventId/replay', async (request, reply) => {
    const { eventId } = request.params as { eventId: string };
    const event = await queryService.replay(eventId, request.principal.sub);
    reply.code(200).send({ event, message: 'Event marked for reprocessing' });
  });
}
