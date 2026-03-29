import { z } from 'zod';

export const LoadIdParam = z.object({
  loadId: z.string().uuid(),
});

export type LoadIdParam = z.infer<typeof LoadIdParam>;
