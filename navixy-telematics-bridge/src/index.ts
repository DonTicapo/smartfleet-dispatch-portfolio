import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { getConfig } from './config.js';
import { getDb, closeDb } from './infrastructure/database/connection.js';
import { registerRequestId } from './infrastructure/middleware/request-id.js';
import { registerAuth } from './infrastructure/middleware/auth.js';
import { registerErrorHandler } from './infrastructure/middleware/error-handler.js';
import { registerSwagger } from './interfaces/http/plugins/swagger.js';

// Navixy + OTL clients
import { NavixyClient } from './infrastructure/navixy/navixy-client.js';
import { OtlCoreClient } from './infrastructure/otl-core/otl-core-client.js';

// Repositories
import { TrackerAssetRepository } from './infrastructure/repositories/tracker-asset-repository.js';
import { TripRepository } from './infrastructure/repositories/trip-repository.js';
import { RouteRepository } from './infrastructure/repositories/route-repository.js';
import { GeofenceZoneRepository } from './infrastructure/repositories/geofence-zone-repository.js';
import { GeofenceEventRepository } from './infrastructure/repositories/geofence-event-repository.js';
import { OutboundEventRepository } from './infrastructure/repositories/outbound-event-repository.js';
import { AuditLogRepository } from './infrastructure/repositories/audit-log-repository.js';

// Services
import { AssetSyncService } from './application/services/asset-sync-service.js';
import { TripSyncService } from './application/services/trip-sync-service.js';
import { RouteService } from './application/services/route-service.js';
import { GeofenceEventService } from './application/services/geofence-event-service.js';
import { OutboundDispatcher } from './application/services/outbound-dispatcher.js';

// Routes
import { registerBridgeRoutes } from './interfaces/http/routes/bridge-routes.js';

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

  // Health check (public)
  app.get('/bridge/navixy/health', async () => ({ status: 'ok' }));

  // External clients
  const navixyClient = new NavixyClient(
    { apiUrl: config.NAVIXY_API_URL, userHash: config.NAVIXY_USER_HASH },
    app.log,
  );
  const otlCoreClient = new OtlCoreClient(
    { baseUrl: config.OTL_CORE_URL, serviceToken: config.OTL_SERVICE_TOKEN },
    app.log,
  );

  // Repositories
  const auditRepo = new AuditLogRepository(db);
  const assetRepo = new TrackerAssetRepository(db);
  const tripRepo = new TripRepository(db);
  const routeRepo = new RouteRepository(db);
  const zoneRepo = new GeofenceZoneRepository(db);
  const geofenceEventRepo = new GeofenceEventRepository(db);
  const outboundRepo = new OutboundEventRepository(db);

  // Services
  const assetSyncService = new AssetSyncService(navixyClient, assetRepo, auditRepo);
  const tripSyncService = new TripSyncService(navixyClient, assetRepo, tripRepo, auditRepo);
  const routeService = new RouteService(navixyClient, tripRepo, routeRepo, assetRepo);
  const geofenceEventService = new GeofenceEventService(
    db, assetRepo, zoneRepo, geofenceEventRepo, outboundRepo, auditRepo, config,
  );

  // Outbound dispatcher (background worker)
  const outboundDispatcher = new OutboundDispatcher(
    outboundRepo, otlCoreClient, config.OUTBOUND_MAX_ATTEMPTS, config.OUTBOUND_POLL_INTERVAL_MS, app.log,
  );

  // Routes
  registerBridgeRoutes(app, assetSyncService, tripSyncService, routeService, geofenceEventService);

  // Start dispatcher on app ready
  app.addHook('onReady', async () => {
    outboundDispatcher.start();
  });

  app.addHook('onClose', async () => {
    outboundDispatcher.stop();
  });

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
