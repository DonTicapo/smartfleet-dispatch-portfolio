import { z } from 'zod';

export const ImportCustomerBody = z.object({
  externalId: z.string().min(1),
  name: z.string().min(1),
  contactEmail: z.string().email().nullish(),
  contactPhone: z.string().nullish(),
  billingAddress: z
    .object({
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(2).max(3),
    })
    .nullish(),
});

export type ImportCustomerBody = z.infer<typeof ImportCustomerBody>;

export const ImportSiteBody = z.object({
  customerId: z.string().uuid(),
  name: z.string().min(1),
  address: z.object({
    line1: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(2).max(3),
  }),
});

export type ImportSiteBody = z.infer<typeof ImportSiteBody>;

export const ImportMixDesignBody = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullish(),
  strengthPsi: z.number().int().positive().nullish(),
  slumpInches: z.number().positive().nullish(),
});

export type ImportMixDesignBody = z.infer<typeof ImportMixDesignBody>;

export const ImportOrderBody = z.object({
  externalId: z.string().min(1),
  customerId: z.string().uuid(),
  mixDesignId: z.string().uuid(),
  requestedQuantity: z.object({
    amount: z.number().positive(),
    unit: z.enum(['M3', 'CY']),
  }),
  requestedDeliveryDate: z.string(),
  specialInstructions: z.string().nullish(),
  status: z.string().optional(),
});

export type ImportOrderBody = z.infer<typeof ImportOrderBody>;
