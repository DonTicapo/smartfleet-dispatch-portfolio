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
import { CustomerRepository } from './infrastructure/repositories/customer-repository.js';
import { SiteRepository } from './infrastructure/repositories/site-repository.js';
import { JobRepository } from './infrastructure/repositories/job-repository.js';
import { MixDesignRepository } from './infrastructure/repositories/mix-design-repository.js';
import { OrderRepository } from './infrastructure/repositories/order-repository.js';
import { TicketRepository } from './infrastructure/repositories/ticket-repository.js';
import { LoadRepository } from './infrastructure/repositories/load-repository.js';
import { DeliveryEventRepository } from './infrastructure/repositories/delivery-event-repository.js';
import { AuditLogRepository } from './infrastructure/repositories/audit-log-repository.js';

// Services
import { CustomerService } from './application/services/customer-service.js';
import { SiteService } from './application/services/site-service.js';
import { JobService } from './application/services/job-service.js';
import { OrderService } from './application/services/order-service.js';
import { TicketService } from './application/services/ticket-service.js';
import { LoadService } from './application/services/load-service.js';
import { DeliveryEventService } from './application/services/delivery-event-service.js';

// Routes
import { registerCustomerRoutes } from './interfaces/http/routes/customer-routes.js';
import { registerSiteRoutes } from './interfaces/http/routes/site-routes.js';
import { registerJobRoutes } from './interfaces/http/routes/job-routes.js';
import { registerOrderRoutes } from './interfaces/http/routes/order-routes.js';
import { registerTicketRoutes } from './interfaces/http/routes/ticket-routes.js';
import { registerLoadRoutes } from './interfaces/http/routes/load-routes.js';
import { registerDeliveryEventRoutes } from './interfaces/http/routes/delivery-event-routes.js';

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

  // Middleware
  registerRequestId(app);
  registerAuth(app);
  registerErrorHandler(app);
  await registerSwagger(app);

  // Health check (public, no auth)
  app.get('/health', async () => ({ status: 'ok' }));

  // Repositories
  const auditRepo = new AuditLogRepository(db);
  const customerRepo = new CustomerRepository(db);
  const siteRepo = new SiteRepository(db);
  const jobRepo = new JobRepository(db);
  // MixDesignRepository instantiated for future use in mix-design routes
  new MixDesignRepository(db);
  const orderRepo = new OrderRepository(db);
  const ticketRepo = new TicketRepository(db);
  const loadRepo = new LoadRepository(db);
  const eventRepo = new DeliveryEventRepository(db);

  // Services
  const customerService = new CustomerService(customerRepo, auditRepo);
  const siteService = new SiteService(siteRepo, auditRepo);
  const jobService = new JobService(jobRepo, auditRepo);
  const orderService = new OrderService(db, orderRepo, auditRepo);
  const ticketService = new TicketService(db, ticketRepo, loadRepo, eventRepo, auditRepo);
  const loadService = new LoadService(db, loadRepo, auditRepo);
  const deliveryEventService = new DeliveryEventService(db, eventRepo, loadRepo, auditRepo);

  // Routes
  registerCustomerRoutes(app, customerService);
  registerSiteRoutes(app, siteService);
  registerJobRoutes(app, jobService);
  registerOrderRoutes(app, orderService);
  registerTicketRoutes(app, ticketService);
  registerLoadRoutes(app, loadService);
  registerDeliveryEventRoutes(app, deliveryEventService);

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
