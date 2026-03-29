import type { Address } from '../value-objects/address.js';
import type { GeoPoint } from '../value-objects/geo-point.js';

export interface Site {
  id: string;
  customerId: string;
  name: string;
  address: Address;
  geoPoint: GeoPoint | null;
  geofenceRadiusMeters: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
