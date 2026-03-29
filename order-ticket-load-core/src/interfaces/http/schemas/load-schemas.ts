import { z } from 'zod';

export const CreateLoadBody = z.object({
  ticketId: z.string().uuid(),
  truckId: z.string().nullish(),
  driverId: z.string().nullish(),
  mixDesignId: z.string().uuid(),
  actualQuantity: z
    .object({
      amount: z.number().positive(),
      unit: z.enum(['CY', 'CM']),
    })
    .nullish(),
});

export type CreateLoadBody = z.infer<typeof CreateLoadBody>;
