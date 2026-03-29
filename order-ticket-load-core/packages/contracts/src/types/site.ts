import type { AddressDto } from './customer.js';

export interface SiteDto {
  id: string;
  customerId: string;
  name: string;
  address: AddressDto;
  geoPoint: GeoPointDto | null;
  geofenceRadiusMeters: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeoPointDto {
  latitude: number;
  longitude: number;
}
