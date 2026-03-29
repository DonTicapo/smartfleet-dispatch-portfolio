import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { getConfig } from './config.js';
import { getDb, closeDb } from './infrastructure/database/connection.js';
import { registerRequestId } from './infrastructure/middleware/request-id.js';
import { registerAuth } from './infrastructure/middleware/auth.js';
import { registerErrorHandler } from './infrastructure/middleware/error-handler.js';
import { registerSwagger } from './interfaces/http/plugins/swagger.js';

import { TruckRepository } from './infrastructure/repositories/truck-repository.js';
import { DriverRepository } from './infrastructure/repositories/driver-repository.js';
import { AssignmentRepository } from './infrastructure/repositories/assignment-repository.js';
import { ExceptionRepository } from './infrastructure/repositories/exception-repository.js';
import { DispatchBoardRepository } from './infrastructure/repositories/dispatch-board-repository.js';
import { AuditLogRepository } from './infrastructure/repositories/audit-log-repository.js';
import { OtlCoreClient } from './infrastructure/otl-core/otl-core-client.js';

import { TruckService } from './application/services/truck-service.js';
import { DriverService } from './application/services/driver-service.js';
import { AssignmentService } from './application/services/assignment-service.js';
import { ExceptionService } from './application/services/exception-service.js';
import { DispatchBoardService } from './application/services/dispatch-board-service.js';

import { registerTruckRoutes } from './interfaces/http/routes/truck-routes.js';
import { registerDriverRoutes } from './interfaces/http/routes/driver-routes.js';
import { registerDispatchRoutes } from './interfaces/http/routes/dispatch-routes.js';

export async function buildApp() {
  const config = getConfig();
  const db = getDb(config.DATABASE_URL);

  const app = Fastify({ logger: { level: config.LOG_LEVEL } });

  // Production hardening
  await app.register(cors, {
    origin: true,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  registerRequestId(app);
  registerAuth(app);
  registerErrorHandler(app);
  await registerSwagger(app);

  app.get('/health', async () => ({ status: 'ok' }));

  const auditRepo = new AuditLogRepository(db);
  const truckRepo = new TruckRepository(db);
  const driverRepo = new DriverRepository(db);
  const assignmentRepo = new AssignmentRepository(db);
  const exceptionRepo = new ExceptionRepository(db);
  const boardRepo = new DispatchBoardRepository(db);
  const otlCoreClient = new OtlCoreClient({ baseUrl: config.OTL_CORE_URL, serviceToken: config.OTL_SERVICE_TOKEN }, app.log);

  const truckService = new TruckService(truckRepo, auditRepo);
  const driverService = new DriverService(driverRepo, auditRepo);
  const assignmentService = new AssignmentService(db, assignmentRepo, truckRepo, driverRepo, auditRepo, otlCoreClient);
  const exceptionService = new ExceptionService(exceptionRepo, auditRepo);
  const boardService = new DispatchBoardService(boardRepo, assignmentRepo, otlCoreClient);

  registerTruckRoutes(app, truckService);
  registerDriverRoutes(app, driverService);
  registerDispatchRoutes(app, assignmentService, exceptionService, boardService);

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
  const shutdown = async () => { app.log.info('Shutting down...'); await app.close(); await closeDb(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
