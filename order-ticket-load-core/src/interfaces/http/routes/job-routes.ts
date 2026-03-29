import type { FastifyInstance } from 'fastify';
import { CreateJobBody } from '../schemas/job-schemas.js';
import type { JobService } from '../../../application/services/job-service.js';

export function registerJobRoutes(app: FastifyInstance, service: JobService): void {
  app.post('/jobs', async (request, reply) => {
    const body = CreateJobBody.parse(request.body);
    const job = await service.create(
      {
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
      request.principal.sub,
    );
    reply.code(201).send(job);
  });

  app.get('/jobs/:id', async (request) => {
    const { id } = request.params as { id: string };
    return service.getById(id);
  });
}
