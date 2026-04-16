import { z } from 'zod';

export const CreateOrderBody = z.object({
  externalId: z.string().nullish(),
  customerId: z.string().uuid(),
  jobId: z.string().uuid(),
  mixDesignId: z.string().uuid(),
  requestedQuantity: z.object({
    amount: z.number().positive(),
    unit: z.enum(['M3', 'CY']),
  }),
  requestedDeliveryDate: z.string(),
  requestedDeliveryTime: z.string().nullish(),
  specialInstructions: z.string().nullish(),
});

export type CreateOrderBody = z.infer<typeof CreateOrderBody>;
