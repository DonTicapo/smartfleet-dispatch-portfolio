import type { FastifyInstance } from 'fastify';
import { LoadIdParam } from '../schemas/load-schemas.js';
import type { LoadTrackerService } from '../../../application/services/load-tracker-service.js';

export function registerLoadRoutes(
  app: FastifyInstance,
  loadTrackerService: LoadTrackerService,
): void {
  app.get('/portal/loads/:loadId/eta', async (request) => {
    const { loadId } = LoadIdParam.parse(request.params);
    const { customerId } = request.principal;
    return loadTrackerService.getEta(loadId, customerId);
  });
}
