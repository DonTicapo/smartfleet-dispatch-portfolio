import { z } from 'zod';

export const CreateJobBody = z.object({
  customerId: z.string().uuid(),
  siteId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullish(),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
});

export type CreateJobBody = z.infer<typeof CreateJobBody>;
