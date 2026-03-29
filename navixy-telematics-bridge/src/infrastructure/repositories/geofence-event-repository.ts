import type { Knex } from 'knex';
import type { GeofenceEvent } from '../../domain/entities/geofence-event.js';
import type { GeofenceTransition } from '../../domain/enums/geofence-transition.js';

interface EventRow {
  id: string;
  tracker_asset_id: string;
  geofence_zone_id: string;
  transition: string;
  latitude: string;
  longitude: string;
  occurred_at: Date;
  navixy_event_id: string | null;
  processed_at: Date | null;
  created_at: Date;
}

function toEntity(row: EventRow): GeofenceEvent {
  return {
    id: row.id,
    trackerAssetId: row.tracker_asset_id,
    geofenceZoneId: row.geofence_zone_id,
    transition: row.transition as GeofenceTransition,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    occurredAt: row.occurred_at,
    navixyEventId: row.navixy_event_id,
    processedAt: row.processed_at,
    createdAt: row.created_at,
  };
}

export interface InsertResult {
  event: GeofenceEvent;
  isNew: boolean;
}

export class GeofenceEventRepository {
  constructor(private db: Knex) {}

  async insertIdempotent(fields: Record<string, unknown>, trx?: Knex.Transaction): Promise<InsertResult> {
    const qb = trx || this.db;
    const result = await qb.raw(
      `INSERT INTO geofence_events (tracker_asset_id, geofence_zone_id, transition, latitude, longitude, occurred_at, navixy_event_id)
       VALUES (:tracker_asset_id, :geofence_zone_id, :transition, :latitude, :longitude, :occurred_at, :navixy_event_id)
       ON CONFLICT (navixy_event_id) DO NOTHING
       RETURNING *`,
      fields,
    );
    if (result.rows.length > 0) {
      return { event: toEntity(result.rows[0]), isNew: true };
    }
    const existing = await qb('geofence_events')
      .where({ navixy_event_id: fields.navixy_event_id })
      .first();
    return { event: toEntity(existing), isNew: false };
  }

  async markProcessed(id: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx || this.db;
    await qb('geofence_events').where({ id }).update({ processed_at: new Date() });
  }
}
