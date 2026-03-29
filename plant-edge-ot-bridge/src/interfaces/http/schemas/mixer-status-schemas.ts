import { z } from 'zod';

export const RecordMixerStatusBody = z.object({
  plantId: z.string().uuid(),
  mixerId: z.string().uuid(),
  status: z.enum(['IDLE', 'MIXING', 'CLEANING', 'MAINTENANCE', 'FAULT']),
  reason: z.string().nullish(),
  operatorId: z.string().nullish(),
  occurredAt: z.string().datetime({ offset: true }),
});

export type RecordMixerStatusBody = z.infer<typeof RecordMixerStatusBody>;

export const MixerStatusHistoryParams = z.object({
  limit: z.coerce.number().int().positive().max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type MixerStatusHistoryParams = z.infer<typeof MixerStatusHistoryParams>;
