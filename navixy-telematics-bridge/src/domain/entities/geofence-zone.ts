import type { ZoneType } from '../enums/zone-type.js';

export interface GeofenceZone {
  id: string;
  navixyGeofenceId: number | null;
  name: string;
  zoneType: ZoneType;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  siteId: string | null;
  plantId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
