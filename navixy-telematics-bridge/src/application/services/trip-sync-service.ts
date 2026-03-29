import type { NavixyClient } from '../../infrastructure/navixy/navixy-client.js';
import type { TrackerAssetRepository } from '../../infrastructure/repositories/tracker-asset-repository.js';
import type { TripRepository } from '../../infrastructure/repositories/trip-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';
import { mapTripToFields } from '../../infrastructure/navixy/navixy-mapper.js';

export interface TripSyncInput {
  trackerAssetId?: string;
  from: Date;
  to: Date;
}

export interface TripSyncSummary {
  total: number;
  synced: number;
}

export class TripSyncService {
  constructor(
    private navixyClient: NavixyClient,
    private assetRepo: TrackerAssetRepository,
    private tripRepo: TripRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async sync(input: TripSyncInput, actor: string): Promise<TripSyncSummary> {
    let assets;
    if (input.trackerAssetId) {
      const asset = await this.assetRepo.findById(input.trackerAssetId);
      assets = asset ? [asset] : [];
    } else {
      assets = await this.assetRepo.findAllActive();
    }

    let total = 0;
    for (const asset of assets) {
      const trips = await this.navixyClient.listTrips(asset.navixyTrackerId, input.from, input.to);
      for (const raw of trips) {
        const fields = mapTripToFields(raw, asset.id);
        await this.tripRepo.upsert(fields);
        total++;
      }
    }

    await this.auditRepo.log({
      entityType: 'TripSync',
      entityId: 'batch',
      action: 'SYNC',
      actor,
      changes: { trackers: assets.length, tripsSynced: total },
    });

    return { total, synced: total };
  }
}
