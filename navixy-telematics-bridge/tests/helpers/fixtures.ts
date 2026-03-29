import { randomUUID } from 'crypto';

export function makeTrackerAsset(overrides: Record<string, unknown> = {}) {
  return {
    navixy_tracker_id: Math.floor(Math.random() * 100000),
    label: 'Test Truck',
    truck_id: `truck-${randomUUID().slice(0, 8)}`,
    model: 'Teltonika FMB920',
    status: 'ACTIVE',
    ...overrides,
  };
}

export function makeGeofenceZone(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Test Zone',
    zone_type: 'PLANT',
    latitude: 32.78,
    longitude: -96.8,
    radius_meters: 200,
    ...overrides,
  };
}

export function makeGeofenceEvent(
  trackerAssetId: string,
  geofenceZoneId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    tracker_asset_id: trackerAssetId,
    geofence_zone_id: geofenceZoneId,
    transition: 'EXIT',
    latitude: 32.78,
    longitude: -96.8,
    occurred_at: new Date(),
    navixy_event_id: `nav-${randomUUID().slice(0, 8)}`,
    ...overrides,
  };
}
