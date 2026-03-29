import type { Knex } from 'knex';
import type { Site } from '../../domain/entities/site.js';
import type { Address } from '../../domain/value-objects/address.js';
import type { GeoPoint } from '../../domain/value-objects/geo-point.js';

interface SiteRow {
  id: string;
  customer_id: string;
  name: string;
  address: Address;
  geo_point: GeoPoint | null;
  geofence_radius_meters: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: SiteRow): Site {
  return {
    id: row.id,
    customerId: row.customer_id,
    name: row.name,
    address: row.address,
    geoPoint: row.geo_point,
    geofenceRadiusMeters: row.geofence_radius_meters,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SiteRepository {
  constructor(private db: Knex) {}

  async create(data: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>): Promise<Site> {
    const [row] = await this.db('sites')
      .insert({
        customer_id: data.customerId,
        name: data.name,
        address: JSON.stringify(data.address),
        geo_point: data.geoPoint ? JSON.stringify(data.geoPoint) : null,
        geofence_radius_meters: data.geofenceRadiusMeters,
        notes: data.notes,
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<Site | null> {
    const row = await this.db('sites').where({ id }).first();
    return row ? toEntity(row) : null;
  }
}
