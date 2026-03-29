import Fastify from 'fastify';
import { getConfig } from './config.js';
import { getDb, closeDb } from './infrastructure/database/connection.js';
import { registerRequestId } from './infrastructure/middleware/request-id.js';
import { registerAuth } from './infrastructure/middleware/auth.js';
import { registerErrorHandler } from './infrastructure/middleware/error-handler.js';
import { registerSwagger } from './interfaces/http/plugins/swagger.js';

// Repositories
import { IngestEventRepository } from './infrastructure/repositories/ingest-event-repository.js';
import { KpiDefinitionRepository } from './infrastructure/repositories/kpi-definition-repository.js';
import { KpiSnapshotRepository } from './infrastructure/repositories/kpi-snapshot-repository.js';
import { ErpExportRepository } from './infrastructure/repositories/erp-export-repository.js';
import { WebhookSubscriptionRepository } from './infrastructure/repositories/webhook-subscription-repository.js';
import { WebhookDeliveryRepository } from './infrastructure/repositories/webhook-delivery-repository.js';
import { AuditLogRepository } from './infrastructure/repositories/audit-log-repository.js';

// Services
import { EventIngestionService } from './application/services/event-ingestion-service.js';
import { EventQueryService } from './application/services/event-query-service.js';
import { KpiService } from './application/services/kpi-service.js';
import { ErpExportService } from './application/services/erp-export-service.js';
import { WebhookService } from './application/services/webhook-service.js';

// Routes
import { registerEventRoutes } from './interfaces/http/routes/event-routes.js';
import { registerKpiRoutes } from './interfaces/http/routes/kpi-routes.js';
import { registerErpRoutes } from './interfaces/http/routes/erp-routes.js';
import { registerWebhookRoutes } from './interfaces/http/routes/webhook-routes.js';

export async function buildApp() {
  const config = getConfig();
  const db = getDb(config.DATABASE_URL);

  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
    },
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
  const eventRepo = new IngestEventRepository(db);
  const kpiDefRepo = new KpiDefinitionRepository(db);
  const kpiSnapRepo = new KpiSnapshotRepository(db);
  const exportRepo = new ErpExportRepository(db);
  const webhookSubRepo = new WebhookSubscriptionRepository(db);
  const webhookDeliveryRepo = new WebhookDeliveryRepository(db);

  // Services
  const eventIngestionService = new EventIngestionService(db, eventRepo, webhookSubRepo, webhookDeliveryRepo, auditRepo);
  const eventQueryService = new EventQueryService(db, eventRepo, auditRepo);
  const kpiService = new KpiService(db, kpiDefRepo, kpiSnapRepo, eventRepo, auditRepo);
  const erpExportService = new ErpExportService(db, exportRepo, eventRepo, kpiSnapRepo, auditRepo);
  const webhookService = new WebhookService(db, webhookSubRepo, webhookDeliveryRepo, eventRepo, auditRepo);

  // Routes
  registerEventRoutes(app, eventIngestionService, eventQueryService);
  registerKpiRoutes(app, kpiService);
  registerErpRoutes(app, erpExportService);
  registerWebhookRoutes(app, webhookService);

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
