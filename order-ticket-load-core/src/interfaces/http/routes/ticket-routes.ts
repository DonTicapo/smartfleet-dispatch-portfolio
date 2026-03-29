import type { FastifyInstance } from 'fastify';
import { CreateTicketBody } from '../schemas/ticket-schemas.js';
import type { TicketService } from '../../../application/services/ticket-service.js';

export function registerTicketRoutes(app: FastifyInstance, service: TicketService): void {
  app.post('/tickets', async (request, reply) => {
    const body = CreateTicketBody.parse(request.body);
    const ticket = await service.create(
      {
        ...body,
        scheduledDate: new Date(body.scheduledDate),
      },
      request.principal.sub,
    );
    reply.code(201).send(ticket);
  });

  app.get('/tickets/:id', async (request) => {
    const { id } = request.params as { id: string };
    return service.getDetail(id);
  });
}
