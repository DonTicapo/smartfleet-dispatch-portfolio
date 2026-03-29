import type { DriverStatus } from '../enums/driver-status.js';

export interface Driver {
  id: string;
  externalId: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  licenseNumber: string | null;
  status: DriverStatus;
  defaultTruckId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
