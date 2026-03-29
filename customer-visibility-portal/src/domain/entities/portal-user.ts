import type { PortalUserRole } from '../enums/portal-user-role.js';

export interface PortalUser {
  id: string;
  customerId: string;
  email: string;
  name: string;
  role: PortalUserRole;
  passwordHash: string;
  lastLoginAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
