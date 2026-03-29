import type { GeofenceTransition } from '../enums/geofence-transition.js';

export interface GeofenceEvent {
  id: string;
  trackerAssetId: string;
  geofenceZoneId: string;
  transition: GeofenceTransition;
  latitude: number;
  longitude: number;
  occurredAt: Date;
  navixyEventId: string | null;
  processedAt: Date | null;
  createdAt: Date;
}
