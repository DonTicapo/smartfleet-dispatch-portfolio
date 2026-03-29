import type { FastifyInstance } from 'fastify';
import { SyncTripsBody, RouteByTripBody, GeofenceEventBody } from '../schemas/bridge-schemas.js';
import type { AssetSyncService } from '../../../application/services/asset-sync-service.js';
import type { TripSyncService } from '../../../application/services/trip-sync-service.js';
import type { RouteService } from '../../../application/services/route-service.js';
import type { GeofenceEventService } from '../../../application/services/geofence-event-service.js';
import type { GeofenceTransition } from '../../../domain/enums/geofence-transition.js';

export function registerBridgeRoutes(
  app: FastifyInstance,
  assetSyncService: AssetSyncService,
  tripSyncService: TripSyncService,
  routeService: RouteService,
  geofenceEventService: GeofenceEventService,
): void {
  app.post('/bridge/navixy/sync-assets', async (request, reply) => {
    const summary = await assetSyncService.sync(request.principal.sub);
    reply.code(200).send(summary);
  });

  app.post('/bridge/navixy/sync-trips', async (request, reply) => {
    const body = SyncTripsBody.parse(request.body);
    const summary = await tripSyncService.sync(
      {
        trackerAssetId: body.trackerAssetId,
        from: new Date(body.from),
        to: new Date(body.to),
      },
      request.principal.sub,
    );
    reply.code(200).send(summary);
  });

  app.post('/bridge/navixy/routes/by-trip', async (request, reply) => {
    const body = RouteByTripBody.parse(request.body);
    const route = await routeService.getByTripId(body.tripId);
    reply.code(200).send(route);
  });

  app.post('/bridge/navixy/events/geofence', async (request, reply) => {
    const body = GeofenceEventBody.parse(request.body);
    const result = await geofenceEventService.record(
      {
        trackerAssetId: body.trackerAssetId,
        geofenceZoneId: body.geofenceZoneId,
        transition: body.transition as GeofenceTransition,
        latitude: body.latitude,
        longitude: body.longitude,
        occurredAt: new Date(body.occurredAt),
        navixyEventId: body.navixyEventId,
      },
      request.principal.sub,
    );
    reply.code(result.isNew ? 201 : 200).send(result);
  });
}
