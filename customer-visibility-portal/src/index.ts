import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyWebsocket from '@fastify/websocket';
import jwt from 'jsonwebtoken';
import { getConfig } from './config.js';
import { getDb, closeDb } from './infrastructure/database/connection.js';
import { registerRequestId } from './infrastructure/middleware/request-id.js';
import { registerAuth } from './infrastructure/middleware/auth.js';
import { registerErrorHandler } from './infrastructure/middleware/error-handler.js';
import { registerSwagger } from './interfaces/http/plugins/swagger.js';

// Repositories
import { PortalUserRepository } from './infrastructure/repositories/portal-user-repository.js';
import { OrderViewRepository } from './infrastructure/repositories/order-view-repository.js';
import { TicketViewRepository } from './infrastructure/repositories/ticket-view-repository.js';
import { LoadTrackerRepository } from './infrastructure/repositories/load-tracker-repository.js';
import { MessageRepository } from './infrastructure/repositories/message-repository.js';
import { AuditLogRepository } from './infrastructure/repositories/audit-log-repository.js';

// Services
import { AuthService } from './application/services/auth-service.js';
import { OrderViewService } from './application/services/order-view-service.js';
import { TicketViewService } from './application/services/ticket-view-service.js';
import { LoadTrackerService } from './application/services/load-tracker-service.js';
import { MessageService } from './application/services/message-service.js';
import { SyncService } from './application/services/sync-service.js';

// Clients
import { OtlCoreClient } from './infrastructure/clients/otl-core-client.js';
import { NavixyBridgeClient } from './infrastructure/clients/navixy-bridge-client.js';

// Routes
import { registerAuthRoutes } from './interfaces/http/routes/auth-routes.js';
import { registerOrderRoutes } from './interfaces/http/routes/order-routes.js';
import { registerTicketRoutes } from './interfaces/http/routes/ticket-routes.js';
import { registerLoadRoutes } from './interfaces/http/routes/load-routes.js';
import { registerMessageRoutes } from './interfaces/http/routes/message-routes.js';
import { registerSyncRoutes } from './interfaces/http/routes/sync-routes.js';
import { registerLoadTrackingWs } from './interfaces/ws/load-tracking-ws.js';

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
    max: 100,
    timeWindow: '1 minute',
  });

  // Plugins
  await app.register(fastifyWebsocket);

  // Middleware
  registerRequestId(app);
  registerAuth(app);
  registerErrorHandler(app);
  await registerSwagger(app);

  // Health check (public, no auth)
  app.get('/health', async () => ({ status: 'ok' }));

  // Generate service token for inter-service calls
  const serviceToken = jwt.sign(
    { sub: 'cvp-service', role: 'service', customerId: '' },
    config.SERVICE_JWT_SECRET,
    { expiresIn: '24h' },
  );

  // Clients
  const otlClient = new OtlCoreClient(serviceToken);
  const navixyClient = new NavixyBridgeClient(serviceToken);

  // Repositories
  const auditRepo = new AuditLogRepository(db);
  const portalUserRepo = new PortalUserRepository(db);
  const orderViewRepo = new OrderViewRepository(db);
  const ticketViewRepo = new TicketViewRepository(db);
  const loadTrackerRepo = new LoadTrackerRepository(db);
  const messageRepo = new MessageRepository(db);

  // Services
  const authService = new AuthService(db, portalUserRepo, auditRepo);
  const orderViewService = new OrderViewService(db, orderViewRepo, auditRepo);
  const ticketViewService = new TicketViewService(db, ticketViewRepo, orderViewRepo, auditRepo);
  const loadTrackerService = new LoadTrackerService(
    db,
    loadTrackerRepo,
    ticketViewRepo,
    orderViewRepo,
    auditRepo,
  );
  const messageService = new MessageService(db, messageRepo, auditRepo);
  const syncService = new SyncService(
    db,
    otlClient,
    navixyClient,
    orderViewRepo,
    ticketViewRepo,
    loadTrackerRepo,
    auditRepo,
  );

  // Routes
  registerAuthRoutes(app, authService);
  registerOrderRoutes(app, orderViewService, ticketViewService);
  registerTicketRoutes(app, ticketViewService, loadTrackerService);
  registerLoadRoutes(app, loadTrackerService);
  registerMessageRoutes(app, messageService);
  registerSyncRoutes(app, syncService);

  // WebSocket
  registerLoadTrackingWs(app, loadTrackerService);

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
