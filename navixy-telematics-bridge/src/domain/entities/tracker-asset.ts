import type { TrackerStatus } from '../enums/tracker-status.js';
import type { GeoPoint } from '../value-objects/geo-point.js';

export interface TrackerAsset {
  id: string;
  navixyTrackerId: number;
  label: string;
  truckId: string | null;
  model: string | null;
  status: TrackerStatus;
  lastPosition: GeoPoint | null;
  lastPositionAt: Date | null;
  navixyGroupId: number | null;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
