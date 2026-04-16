import type { FastifyInstance } from 'fastify';
import { TriggerSyncBody } from '../schemas/sap-schemas.js';
import type { SapSyncService } from '../../../application/services/sap-sync-service.js';

export function registerSapRoutes(app: FastifyInstance, service: SapSyncService): void {
  app.post('/integrations/sap/sync', async (request, reply) => {
    const body = TriggerSyncBody.parse(request.body);
    const actor = request.principal.sub;

    if (body.entityType) {
      const result = await service.runEntitySync(body.entityType, actor);
      reply.code(200).send({ data: result });
    } else {
      const result = await service.runFullSync(actor);
      reply.code(200).send({ data: result });
    }
  });

  app.get('/integrations/sap/sync/status', async () => {
    const cursors = await service.getSyncStatus();
    return { data: cursors };
  });

  app.get('/integrations/sap/mirror/stats', async () => {
    const counts = await service.getMirrorStats();
    return { data: counts };
  });
}
