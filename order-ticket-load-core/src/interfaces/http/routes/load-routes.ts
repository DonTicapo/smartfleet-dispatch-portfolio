import type { FastifyInstance } from 'fastify';
import { CreateLoadBody } from '../schemas/load-schemas.js';
import type { LoadService } from '../../../application/services/load-service.js';
import type { UnitOfMeasure } from '../../../domain/enums/unit-of-measure.js';

export function registerLoadRoutes(app: FastifyInstance, service: LoadService): void {
  app.post('/loads', async (request, reply) => {
    const body = CreateLoadBody.parse(request.body);
    const load = await service.create(
      {
        ...body,
        actualQuantity: body.actualQuantity
          ? { amount: body.actualQuantity.amount, unit: body.actualQuantity.unit as UnitOfMeasure }
          : null,
      },
      request.principal.sub,
    );
    reply.code(201).send(load);
  });

  app.get('/loads/:id', async (request) => {
    const { id } = request.params as { id: string };
    return service.getById(id);
  });
}
