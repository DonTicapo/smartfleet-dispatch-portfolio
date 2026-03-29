import type { FastifyInstance } from 'fastify';
import { CreateSiteBody } from '../schemas/site-schemas.js';
import type { SiteService } from '../../../application/services/site-service.js';

export function registerSiteRoutes(app: FastifyInstance, service: SiteService): void {
  app.post('/sites', async (request, reply) => {
    const body = CreateSiteBody.parse(request.body);
    const site = await service.create(body, request.principal.sub);
    reply.code(201).send(site);
  });

  app.get('/sites/:id', async (request) => {
    const { id } = request.params as { id: string };
    return service.getById(id);
  });
}
