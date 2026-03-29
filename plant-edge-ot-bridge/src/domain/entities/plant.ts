import type { GeoLocation } from '../value-objects/geo-location.js';

export interface Plant {
  id: string;
  code: string;
  name: string;
  location: GeoLocation | null;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
