import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { getConfig } from './config.js';
import { getDb, closeDb } from './infrastructure/database/connection.js';
import { registerRequestId } from './infrastructure/middleware/request-id.js';
import { registerAuth } from './infrastructure/middleware/auth.js';
import { registerErrorHandler } from './infrastructure/middleware/error-handler.js';
import { registerSwagger } from './interfaces/http/plugins/swagger.js';

// Repositories
import { PlantRepository } from './infrastructure/repositories/plant-repository.js';
import { MixerRepository } from './infrastructure/repositories/mixer-repository.js';
import { BatchEventRepository } from './infrastructure/repositories/batch-event-repository.js';
import { ScaleReadingRepository } from './infrastructure/repositories/scale-reading-repository.js';
import { MixerStatusLogRepository } from './infrastructure/repositories/mixer-status-log-repository.js';
import { OutboundEventRepository } from './infrastructure/repositories/outbound-event-repository.js';
import { HeartbeatRepository } from './infrastructure/repositories/heartbeat-repository.js';
import { AuditLogRepository } from './infrastructure/repositories/audit-log-repository.js';

// Services
import { PlantService } from './application/services/plant-service.js';
import { BatchEventService } from './application/services/batch-event-service.js';
import { ScaleReadingService } from './application/services/scale-reading-service.js';
import { MixerStatusService } from './application/services/mixer-status-service.js';
import { OutboundService } from './application/services/outbound-service.js';
import { HeartbeatService } from './application/services/heartbeat-service.js';
import { ConfigService } from './application/services/config-service.js';

// Routes
import { registerPlantRoutes, registerPlantImportRoute } from './interfaces/http/routes/plant-routes.js';
import { registerBatchEventRoutes } from './interfaces/http/routes/batch-event-routes.js';
import { registerScaleReadingRoutes } from './interfaces/http/routes/scale-reading-routes.js';
import { registerMixerStatusRoutes } from './interfaces/http/routes/mixer-status-routes.js';
import { registerConfigRoutes } from './interfaces/http/routes/config-routes.js';
import { registerHeartbeatRoutes } from './interfaces/http/routes/heartbeat-routes.js';
import { registerOutboundRoutes } from './interfaces/http/routes/outbound-routes.js';

export async function buildApp() {
  const config = getConfig();
  const db = getDb(config.DATABASE_URL);

  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
    },
  });

  // Production hardening
  await app.register(cors, {
    origin: true,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 5000,
    timeWindow: '1 minute',
  });

  // Middleware
  registerRequestId(app);
  registerAuth(app);
  registerErrorHandler(app);
  await registerSwagger(app);

  // Health check (public, no auth)
  app.get('/health', async () => ({ status: 'ok' }));

  // Repositories
  const auditRepo = new AuditLogRepository(db);
  const plantRepo = new PlantRepository(db);
  const mixerRepo = new MixerRepository(db);
  const batchEventRepo = new BatchEventRepository(db);
  const scaleReadingRepo = new ScaleReadingRepository(db);
  const statusLogRepo = new MixerStatusLogRepository(db);
  const outboundRepo = new OutboundEventRepository(db);
  const heartbeatRepo = new HeartbeatRepository(db);

  // Services
  const plantService = new PlantService(db, plantRepo, mixerRepo, auditRepo);
  const batchEventService = new BatchEventService(db, batchEventRepo, plantRepo, mixerRepo, outboundRepo, auditRepo);
  const scaleReadingService = new ScaleReadingService(db, scaleReadingRepo, plantRepo, mixerRepo, outboundRepo, auditRepo);
  const mixerStatusService = new MixerStatusService(db, mixerRepo, statusLogRepo, plantRepo, outboundRepo, auditRepo);
  const outboundService = new OutboundService(db, outboundRepo, auditRepo);
  const heartbeatService = new HeartbeatService(db, heartbeatRepo, plantRepo, auditRepo);
  const configService = new ConfigService();

  // Routes
  registerPlantRoutes(app, plantService);
  registerPlantImportRoute(app, plantRepo, auditRepo);
  registerBatchEventRoutes(app, batchEventService);
  registerScaleReadingRoutes(app, scaleReadingService);
  registerMixerStatusRoutes(app, mixerStatusService);
  registerConfigRoutes(app, configService);
  registerHeartbeatRoutes(app, heartbeatService);
  registerOutboundRoutes(app, outboundService);

  return app;
}

async function main() {
  const config = getConfig();
  const app = await buildApp();

  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${config.PORT}`);
    app.log.info(`Swagger UI at http://localhost:${config.PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    await closeDb();
    process.exit(1);
  }

  const shutdown = async () => {
    app.log.info('Shutting down...');
    await app.close();
    await closeDb();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
