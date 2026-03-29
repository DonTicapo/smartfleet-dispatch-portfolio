import type { Knex } from 'knex';
import type { GeofenceZone } from '../../domain/entities/geofence-zone.js';
import type { ZoneType } from '../../domain/enums/zone-type.js';

interface ZoneRow {
  id: string;
  navixy_geofence_id: number | null;
  name: string;
  zone_type: string;
  latitude: string;
  longitude: string;
  radius_meters: number;
  site_id: string | null;
  plant_id: string | null;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: ZoneRow): GeofenceZone {
  return {
    id: row.id,
    navixyGeofenceId: row.navixy_geofence_id,
    name: row.name,
    zoneType: row.zone_type as ZoneType,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    radiusMeters: row.radius_meters,
    siteId: row.site_id,
    plantId: row.plant_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class GeofenceZoneRepository {
  constructor(private db: Knex) {}

  async create(fields: Record<string, unknown>): Promise<GeofenceZone> {
    const [row] = await this.db('geofence_zones').insert(fields).returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<GeofenceZone | null> {
    const row = await this.db('geofence_zones').where({ id }).first();
    return row ? toEntity(row) : null;
  }
}
