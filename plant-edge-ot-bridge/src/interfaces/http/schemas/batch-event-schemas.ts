import { z } from 'zod';

export const RecordBatchEventBody = z.object({
  eventId: z.string().min(1),
  plantId: z.string().uuid(),
  mixerId: z.string().uuid(),
  ticketNumber: z.string().nullish(),
  batchNumber: z.string().min(1),
  eventType: z.enum([
    'BATCH_STARTED',
    'BATCH_WEIGHING',
    'BATCH_MIXING',
    'BATCH_COMPLETE',
    'BATCH_LOADED',
    'BATCH_REJECTED',
  ]),
  payload: z.record(z.unknown()).optional(),
  occurredAt: z.string().datetime({ offset: true }),
});

export type RecordBatchEventBody = z.infer<typeof RecordBatchEventBody>;

export const BatchEventQueryParams = z.object({
  plantId: z.string().uuid().optional(),
  mixerId: z.string().uuid().optional(),
  ticketNumber: z.string().optional(),
  eventType: z
    .enum([
      'BATCH_STARTED',
      'BATCH_WEIGHING',
      'BATCH_MIXING',
      'BATCH_COMPLETE',
      'BATCH_LOADED',
      'BATCH_REJECTED',
    ])
    .optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type BatchEventQueryParams = z.infer<typeof BatchEventQueryParams>;
