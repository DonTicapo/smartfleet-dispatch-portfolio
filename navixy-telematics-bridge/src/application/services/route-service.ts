import type { NavixyClient } from '../../infrastructure/navixy/navixy-client.js';
import type { TripRepository } from '../../infrastructure/repositories/trip-repository.js';
import type { RouteRepository } from '../../infrastructure/repositories/route-repository.js';
import type { TrackerAssetRepository } from '../../infrastructure/repositories/tracker-asset-repository.js';
import type { Route } from '../../domain/entities/route.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import { mapRoutePoints } from '../../infrastructure/navixy/navixy-mapper.js';

export class RouteService {
  constructor(
    private navixyClient: NavixyClient,
    private tripRepo: TripRepository,
    private routeRepo: RouteRepository,
    private assetRepo: TrackerAssetRepository,
  ) {}

  async getByTripId(tripId: string): Promise<Route> {
    // Check cache first
    const cached = await this.routeRepo.findByTripId(tripId);
    if (cached) return cached;

    // Fetch from Navixy
    const trip = await this.tripRepo.findById(tripId);
    if (!trip) throw new EntityNotFoundError('Trip', tripId);

    const asset = await this.assetRepo.findById(trip.trackerAssetId);
    if (!asset) throw new EntityNotFoundError('TrackerAsset', trip.trackerAssetId);

    const endAt = trip.endedAt ?? new Date();
    const rawPoints = await this.navixyClient.getRoute(asset.navixyTrackerId, trip.startedAt, endAt);
    const points = mapRoutePoints(rawPoints);

    return this.routeRepo.upsert(tripId, points);
  }
}
