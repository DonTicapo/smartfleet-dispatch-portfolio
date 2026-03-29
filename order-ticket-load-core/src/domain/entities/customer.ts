import type { Address } from '../value-objects/address.js';

export interface Customer {
  id: string;
  externalId: string | null;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  billingAddress: Address | null;
  createdAt: Date;
  updatedAt: Date;
}
