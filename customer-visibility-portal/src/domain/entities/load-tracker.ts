import type { LoadTrackerStatus } from '../enums/load-tracker-status.js';

export interface LoadTracker {
  id: string;
  externalLoadId: string;
  ticketId: string;
  loadNumber: number;
  truckId: string | null;
  driverId: string | null;
  status: LoadTrackerStatus;
  currentLat: number | null;
  currentLon: number | null;
  etaMinutes: number | null;
  lastPositionAt: Date | null;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
