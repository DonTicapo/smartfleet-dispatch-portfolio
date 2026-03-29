import { z } from 'zod';

export const CreateCustomerBody = z.object({
  externalId: z.string().nullish(),
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
      country: z.string().length(2),
    })
    .nullish(),
});

export type CreateCustomerBody = z.infer<typeof CreateCustomerBody>;
