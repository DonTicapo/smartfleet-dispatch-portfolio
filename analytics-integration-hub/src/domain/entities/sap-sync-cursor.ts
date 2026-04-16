import type { SapSyncEntityType } from '../enums/sap-sync-entity-type.js';
import type { SapSyncStatus } from '../enums/sap-sync-status.js';

export interface SapSyncCursor {
  id: string;
  entityType: SapSyncEntityType;
  lastSyncedAt: Date | null;
  recordsSynced: number;
  status: SapSyncStatus;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SapEntityMapping {
  id: string;
  entityType: SapSyncEntityType;
  sapKey: string;
  smartfleetId: string;
  sapCompanyDb: string;
  syncedAt: Date;
  createdAt: Date;
}
