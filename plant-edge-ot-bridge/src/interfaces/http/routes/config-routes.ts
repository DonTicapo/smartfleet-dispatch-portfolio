import type { FastifyInstance } from 'fastify';
import type { ConfigService } from '../../../application/services/config-service.js';

export function registerConfigRoutes(app: FastifyInstance, service: ConfigService): void {
  app.get('/edge/config', async () => {
    return service.getConfig();
  });
}
