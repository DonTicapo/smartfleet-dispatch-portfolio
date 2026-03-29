import { z } from 'zod';

export const OutboundQueueParams = z.object({
  status: z.enum(['PENDING', 'SENT', 'FAILED', 'DEAD_LETTER']).optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type OutboundQueueParams = z.infer<typeof OutboundQueueParams>;
