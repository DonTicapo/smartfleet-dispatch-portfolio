import type { Knex } from 'knex';
import type { Trip } from '../../domain/entities/trip.js';
import type { TripStatus } from '../../domain/enums/trip-status.js';

interface TripRow {
  id: string;
  tracker_asset_id: string;
  navixy_trip_id: number | null;
  start_at: Date;
  end_at: Date | null;
  start_latitude: string;
  start_longitude: string;
  end_latitude: string | null;
  end_longitude: string | null;
  distance_meters: number | null;
  status: string;
  load_id: string | null;
  synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: TripRow): Trip {
  return {
    id: row.id,
    trackerAssetId: row.tracker_asset_id,
    navixyTripId: row.navixy_trip_id,
    startedAt: row.start_at,
    endedAt: row.end_at,
    startLatitude: parseFloat(row.start_latitude),
    startLongitude: parseFloat(row.start_longitude),
    endLatitude: row.end_latitude ? parseFloat(row.end_latitude) : null,
    endLongitude: row.end_longitude ? parseFloat(row.end_longitude) : null,
    distanceMeters: row.distance_meters,
    status: row.status as TripStatus,
    loadId: row.load_id,
    syncedAt: row.synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class TripRepository {
  constructor(private db: Knex) {}

  async upsert(fields: Record<string, unknown>): Promise<Trip> {
    const result = await this.db.raw(
      `INSERT INTO trips (tracker_asset_id, navixy_trip_id, start_at, end_at, start_latitude, start_longitude, end_latitude, end_longitude, distance_meters, status, synced_at, updated_at)
       VALUES (:tracker_asset_id, :navixy_trip_id, :start_at, :end_at, :start_latitude, :start_longitude, :end_latitude, :end_longitude, :distance_meters, :status, :synced_at, :updated_at)
       ON CONFLICT (tracker_asset_id, navixy_trip_id) DO UPDATE SET
         end_at = EXCLUDED.end_at,
         end_latitude = EXCLUDED.end_latitude,
         end_longitude = EXCLUDED.end_longitude,
         distance_meters = EXCLUDED.distance_meters,
         status = EXCLUDED.status,
         synced_at = EXCLUDED.synced_at,
         updated_at = EXCLUDED.updated_at
       RETURNING *`,
      fields,
    );
    return toEntity(result.rows[0]);
  }

  async findById(id: string): Promise<Trip | null> {
    const row = await this.db('trips').where({ id }).first();
    return row ? toEntity(row) : null;
  }
}
