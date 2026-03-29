import type { FastifyInstance } from 'fastify';
import { CreateOrderBody } from '../schemas/order-schemas.js';
import type { OrderService } from '../../../application/services/order-service.js';
import type { UnitOfMeasure } from '../../../domain/enums/unit-of-measure.js';

export function registerOrderRoutes(app: FastifyInstance, service: OrderService): void {
  app.post('/orders', async (request, reply) => {
    const body = CreateOrderBody.parse(request.body);
    const order = await service.create(
      {
        ...body,
        requestedQuantity: {
          amount: body.requestedQuantity.amount,
          unit: body.requestedQuantity.unit as UnitOfMeasure,
        },
        requestedDeliveryDate: new Date(body.requestedDeliveryDate),
      },
      request.principal.sub,
    );
    reply.code(201).send(order);
  });

  app.get('/orders/:id', async (request) => {
    const { id } = request.params as { id: string };
    return service.getById(id);
  });
}
