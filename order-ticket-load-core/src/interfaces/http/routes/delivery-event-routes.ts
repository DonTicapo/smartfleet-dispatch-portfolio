import type { FastifyInstance } from 'fastify';
import { RecordDeliveryEventBody } from '../schemas/delivery-event-schemas.js';
import type { DeliveryEventService } from '../../../application/services/delivery-event-service.js';
import type { DeliveryState } from '../../../domain/enums/delivery-state.js';

export function registerDeliveryEventRoutes(
  app: FastifyInstance,
  service: DeliveryEventService,
): void {
  app.post('/events/delivery-state', async (request, reply) => {
    const body = RecordDeliveryEventBody.parse(request.body);
    const result = await service.record(
      {
        ...body,
        state: body.state as DeliveryState,
        occurredAt: new Date(body.occurredAt),
      },
      request.principal.sub,
    );
    reply.code(result.isNew ? 201 : 200).send({
      event: result.event,
      isNew: result.isNew,
      loadStatusChanged: result.loadStatusChanged,
    });
  });
}
