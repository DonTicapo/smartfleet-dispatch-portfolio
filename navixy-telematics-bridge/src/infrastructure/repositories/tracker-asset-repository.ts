import type { Knex } from 'knex';
import type { TrackerAsset } from '../../domain/entities/tracker-asset.js';
import type { TrackerStatus } from '../../domain/enums/tracker-status.js';

interface AssetRow {
  id: string;
  navixy_tracker_id: number;
  label: string;
  truck_id: string | null;
  model: string | null;
  status: string;
  last_latitude: string | null;
  last_longitude: string | null;
  last_position_at: Date | null;
  navixy_group_id: number | null;
  synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: AssetRow): TrackerAsset {
  return {
    id: row.id,
    navixyTrackerId: row.navixy_tracker_id,
    label: row.label,
    truckId: row.truck_id,
    model: row.model,
    status: row.status as TrackerStatus,
    lastPosition:
      row.last_latitude != null && row.last_longitude != null
        ? { latitude: parseFloat(row.last_latitude), longitude: parseFloat(row.last_longitude) }
        : null,
    lastPositionAt: row.last_position_at,
    navixyGroupId: row.navixy_group_id,
    syncedAt: row.synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface UpsertResult {
  asset: TrackerAsset;
  action: 'created' | 'updated' | 'unchanged';
}

export class TrackerAssetRepository {
  constructor(private db: Knex) {}

  async upsert(fields: Record<string, unknown>): Promise<UpsertResult> {
    const result = await this.db.raw(
      `INSERT INTO tracker_assets (navixy_tracker_id, label, model, status, navixy_group_id, synced_at, updated_at)
       VALUES (:navixy_tracker_id, :label, :model, :status, :navixy_group_id, :synced_at, :updated_at)
       ON CONFLICT (navixy_tracker_id) DO UPDATE SET
         label = EXCLUDED.label,
         model = EXCLUDED.model,
         status = EXCLUDED.status,
         navixy_group_id = EXCLUDED.navixy_group_id,
         synced_at = EXCLUDED.synced_at,
         updated_at = EXCLUDED.updated_at
       RETURNING *, (xmax = 0) as is_insert`,
      fields,
    );
    const row = result.rows[0];
    const isInsert = row.is_insert;
    delete row.is_insert;
    return {
      asset: toEntity(row),
      action: isInsert ? 'created' : 'updated',
    };
  }

  async findById(id: string): Promise<TrackerAsset | null> {
    const row = await this.db('tracker_assets').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findByNavixyId(navixyTrackerId: number): Promise<TrackerAsset | null> {
    const row = await this.db('tracker_assets').where({ navixy_tracker_id: navixyTrackerId }).first();
    return row ? toEntity(row) : null;
  }

  async findByTruckId(truckId: string): Promise<TrackerAsset | null> {
    const row = await this.db('tracker_assets').where({ truck_id: truckId }).first();
    return row ? toEntity(row) : null;
  }

  async findAllActive(): Promise<TrackerAsset[]> {
    const rows = await this.db('tracker_assets').where({ status: 'ACTIVE' });
    return rows.map(toEntity);
  }
}
