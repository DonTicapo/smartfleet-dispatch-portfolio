import type { NavixyClient } from '../../infrastructure/navixy/navixy-client.js';
import type { TrackerAssetRepository } from '../../infrastructure/repositories/tracker-asset-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';
import { mapTrackerToAssetFields } from '../../infrastructure/navixy/navixy-mapper.js';

export interface SyncSummary {
  total: number;
  created: number;
  updated: number;
}

export class AssetSyncService {
  constructor(
    private navixyClient: NavixyClient,
    private assetRepo: TrackerAssetRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async sync(actor: string): Promise<SyncSummary> {
    const trackers = await this.navixyClient.listTrackers();

    let created = 0;
    let updated = 0;

    for (const raw of trackers) {
      const fields = mapTrackerToAssetFields(raw);
      const result = await this.assetRepo.upsert(fields);
      if (result.action === 'created') created++;
      else updated++;
    }

    await this.auditRepo.log({
      entityType: 'AssetSync',
      entityId: 'batch',
      action: 'SYNC',
      actor,
      changes: { total: trackers.length, created, updated },
    });

    return { total: trackers.length, created, updated };
  }
}
