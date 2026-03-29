import type { FastifyInstance } from 'fastify';
import { RecordHeartbeatBody } from '../schemas/heartbeat-schemas.js';
import type { HeartbeatService } from '../../../application/services/heartbeat-service.js';

export function registerHeartbeatRoutes(app: FastifyInstance, service: HeartbeatService): void {
  app.post('/edge/heartbeat', async (request, reply) => {
    const body = RecordHeartbeatBody.parse(request.body);
    const heartbeat = await service.record(body, request.principal.sub);
    reply.code(201).send(heartbeat);
  });

  app.get('/edge/heartbeat/:plantId/latest', async (request) => {
    const { plantId } = request.params as { plantId: string };
    return service.getLatest(plantId);
  });
}
