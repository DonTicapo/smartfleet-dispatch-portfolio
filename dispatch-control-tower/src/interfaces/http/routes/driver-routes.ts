import type { FastifyInstance } from 'fastify';
import { CreateDriverBody, UpdateDriverBody } from '../schemas/driver-schemas.js';
import type { DriverService } from '../../../application/services/driver-service.js';

export function registerDriverRoutes(app: FastifyInstance, service: DriverService): void {
  app.post('/drivers', async (req, reply) => {
    const body = CreateDriverBody.parse(req.body);
    reply.code(201).send(await service.create(body, req.principal.sub));
  });
  app.get('/drivers', async (req) => {
    const { status } = req.query as { status?: string };
    return service.list(status);
  });
  app.get('/drivers/:id', async (req) => service.getById((req.params as { id: string }).id));
  app.patch('/drivers/:id', async (req) => {
    const body = UpdateDriverBody.parse(req.body);
    return service.update((req.params as { id: string }).id, body, req.principal.sub);
  });
}
