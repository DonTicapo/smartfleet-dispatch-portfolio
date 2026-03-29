import type { TripStatus } from '../enums/trip-status.js';

export interface Trip {
  id: string;
  trackerAssetId: string;
  navixyTripId: number | null;
  startedAt: Date;
  endedAt: Date | null;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number | null;
  endLongitude: number | null;
  distanceMeters: number | null;
  status: TripStatus;
  loadId: string | null;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
