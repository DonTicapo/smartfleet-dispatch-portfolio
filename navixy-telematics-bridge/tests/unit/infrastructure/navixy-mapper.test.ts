import { describe, it, expect } from 'vitest';
import {
  mapTrackerToAssetFields,
  mapTripToFields,
  mapRoutePoints,
  mapGeofenceToFields,
} from '../../../src/infrastructure/navixy/navixy-mapper.js';
import { TrackerStatus } from '../../../src/domain/enums/tracker-status.js';
import { TripStatus } from '../../../src/domain/enums/trip-status.js';
import type { NavixyTrackerRaw, NavixyTripRaw, NavixyRoutePointRaw, NavixyGeofenceRaw } from '../../../src/infrastructure/navixy/navixy-types.js';

describe('Navixy Mapper', () => {
  describe('mapTrackerToAssetFields', () => {
    it('maps an active tracker', () => {
      const raw: NavixyTrackerRaw = {
        id: 12345,
        label: 'Truck #7',
        source: { id: 1, model: 'Teltonika FMB920', device_id: 'ABC123' },
        status: { connection_status: 'active', movement_status: 'moving', last_update: '2026-03-29T10:00:00Z' },
        group_id: 5,
        last_update: '2026-03-29T10:00:00Z',
      };

      const result = mapTrackerToAssetFields(raw);
      expect(result.navixy_tracker_id).toBe(12345);
      expect(result.label).toBe('Truck #7');
      expect(result.model).toBe('Teltonika FMB920');
      expect(result.status).toBe(TrackerStatus.ACTIVE);
      expect(result.navixy_group_id).toBe(5);
    });

    it('maps an offline tracker', () => {
      const raw: NavixyTrackerRaw = {
        id: 99,
        label: 'Offline Unit',
        source: { id: 2, model: 'Unknown', device_id: 'XYZ' },
        status: { connection_status: 'offline', movement_status: 'stopped', last_update: '' },
        group_id: null,
        last_update: '',
      };

      const result = mapTrackerToAssetFields(raw);
      expect(result.status).toBe(TrackerStatus.OFFLINE);
      expect(result.navixy_group_id).toBeNull();
    });
  });

  describe('mapTripToFields', () => {
    it('maps a completed trip', () => {
      const raw: NavixyTripRaw = {
        id: 1001,
        tracker_id: 12345,
        start_date: '2026-03-29 08:00:00',
        end_date: '2026-03-29 09:30:00',
        start_address: 'Plant A',
        end_address: 'Site B',
        length: 15000,
        start_location: { lat: 32.78, lng: -96.8 },
        end_location: { lat: 32.90, lng: -96.7 },
      };

      const result = mapTripToFields(raw, 'asset-uuid-1');
      expect(result.tracker_asset_id).toBe('asset-uuid-1');
      expect(result.navixy_trip_id).toBe(1001);
      expect(result.distance_meters).toBe(15000);
      expect(result.status).toBe(TripStatus.COMPLETED);
      expect(result.start_latitude).toBe(32.78);
    });
  });

  describe('mapRoutePoints', () => {
    it('maps route points', () => {
      const raw: NavixyRoutePointRaw[] = [
        { lat: 32.78, lng: -96.8, alt: 150, speed: 60, heading: 90, get_time: '2026-03-29T08:00:00Z' },
        { lat: 32.79, lng: -96.79, alt: 155, speed: 55, heading: 85, get_time: '2026-03-29T08:01:00Z' },
      ];

      const result = mapRoutePoints(raw);
      expect(result).toHaveLength(2);
      expect(result[0].latitude).toBe(32.78);
      expect(result[0].longitude).toBe(-96.8);
      expect(result[0].altitude).toBe(150);
      expect(result[1].speed).toBe(55);
    });
  });

  describe('mapGeofenceToFields', () => {
    it('maps a geofence', () => {
      const raw: NavixyGeofenceRaw = {
        id: 500,
        label: 'Plant Alpha',
        color: '#FF0000',
        type: 'circle',
        center: { lat: 32.78, lng: -96.8 },
        radius: 200,
      };

      const result = mapGeofenceToFields(raw);
      expect(result.navixy_geofence_id).toBe(500);
      expect(result.name).toBe('Plant Alpha');
      expect(result.latitude).toBe(32.78);
      expect(result.radius_meters).toBe(200);
    });
  });
});
