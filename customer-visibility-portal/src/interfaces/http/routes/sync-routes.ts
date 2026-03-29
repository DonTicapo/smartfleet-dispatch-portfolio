import type { FastifyInstance } from 'fastify';
import { AuthorizationError } from '../../../domain/errors/domain-error.js';
import type { SyncService } from '../../../application/services/sync-service.js';

function requireServiceRole(role: string): void {
  if (role !== 'service') {
    throw new AuthorizationError('Sync endpoints require service-role access');
  }
}

export function registerSyncRoutes(app: FastifyInstance, syncService: SyncService): void {
  app.post('/portal/sync/orders', async (request, reply) => {
    requireServiceRole(request.principal.role);

    const { customerId } = request.body as { customerId: string };
    if (!customerId) {
      reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'customerId is required' });
      return;
    }

    const result = await syncService.syncOrdersFromOtl(customerId, request.principal.sub);
    reply.code(200).send(result);
  });

  app.post('/portal/sync/positions', async (request, reply) => {
    requireServiceRole(request.principal.role);

    const { customerId } = request.body as { customerId: string };
    if (!customerId) {
      reply.code(400).send({ error: 'VALIDATION_ERROR', message: 'customerId is required' });
      return;
    }

    const result = await syncService.syncPositionsFromNavixy(customerId, request.principal.sub);
    reply.code(200).send(result);
  });
}
