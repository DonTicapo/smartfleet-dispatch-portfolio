export interface CustomerDto {
  id: string;
  externalId: string | null;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  billingAddress: AddressDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddressDto {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
