import type { NavixyTrackerRaw, NavixyTripRaw, NavixyRoutePointRaw, NavixyGeofenceRaw } from './navixy-types.js';
import { TrackerStatus } from '../../domain/enums/tracker-status.js';
import { TripStatus } from '../../domain/enums/trip-status.js';
import type { RoutePoint } from '../../domain/entities/route.js';

export function mapTrackerStatus(connectionStatus: string): TrackerStatus {
  switch (connectionStatus) {
    case 'active':
      return TrackerStatus.ACTIVE;
    case 'idle':
      return TrackerStatus.ACTIVE;
    case 'offline':
      return TrackerStatus.OFFLINE;
    case 'blocked':
      return TrackerStatus.SUSPENDED;
    default:
      return TrackerStatus.INACTIVE;
  }
}

export function mapTrackerToAssetFields(raw: NavixyTrackerRaw) {
  return {
    navixy_tracker_id: raw.id,
    label: raw.label,
    model: raw.source?.model ?? null,
    status: mapTrackerStatus(raw.status?.connection_status ?? 'unknown'),
    navixy_group_id: raw.group_id,
    synced_at: new Date(),
    updated_at: new Date(),
  };
}

export function mapTripToFields(raw: NavixyTripRaw, trackerAssetId: string) {
  return {
    tracker_asset_id: trackerAssetId,
    navixy_trip_id: raw.id,
    start_at: new Date(raw.start_date),
    end_at: raw.end_date ? new Date(raw.end_date) : null,
    start_latitude: raw.start_location.lat,
    start_longitude: raw.start_location.lng,
    end_latitude: raw.end_location?.lat ?? null,
    end_longitude: raw.end_location?.lng ?? null,
    distance_meters: Math.round(raw.length),
    status: raw.end_date ? TripStatus.COMPLETED : TripStatus.IN_PROGRESS,
    synced_at: new Date(),
    updated_at: new Date(),
  };
}

export function mapRoutePoints(raw: NavixyRoutePointRaw[]): RoutePoint[] {
  return raw.map((p) => ({
    latitude: p.lat,
    longitude: p.lng,
    altitude: p.alt || null,
    speed: p.speed || null,
    recordedAt: p.get_time,
  }));
}

export function mapGeofenceToFields(raw: NavixyGeofenceRaw) {
  return {
    navixy_geofence_id: raw.id,
    name: raw.label,
    latitude: raw.center.lat,
    longitude: raw.center.lng,
    radius_meters: Math.round(raw.radius),
    updated_at: new Date(),
  };
}
