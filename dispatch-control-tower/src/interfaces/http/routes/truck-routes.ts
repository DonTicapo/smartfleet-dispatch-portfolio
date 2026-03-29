import type { FastifyInstance } from 'fastify';
import { CreateTruckBody, UpdateTruckBody } from '../schemas/truck-schemas.js';
import type { TruckService } from '../../../application/services/truck-service.js';

export function registerTruckRoutes(app: FastifyInstance, service: TruckService): void {
  app.post('/trucks', async (req, reply) => {
    const body = CreateTruckBody.parse(req.body);
    reply.code(201).send(await service.create(body, req.principal.sub));
  });
  app.get('/trucks', async (req) => {
    const { status } = req.query as { status?: string };
    return service.list(status);
  });
  app.get('/trucks/:id', async (req) => service.getById((req.params as { id: string }).id));
  app.patch('/trucks/:id', async (req) => {
    const body = UpdateTruckBody.parse(req.body);
    return service.update((req.params as { id: string }).id, body, req.principal.sub);
  });
}
