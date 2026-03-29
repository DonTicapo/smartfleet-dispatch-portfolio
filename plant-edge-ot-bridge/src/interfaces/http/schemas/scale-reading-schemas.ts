import { z } from 'zod';

const ScaleReadingItem = z.object({
  plantId: z.string().uuid(),
  mixerId: z.string().uuid(),
  batchNumber: z.string().nullish(),
  materialType: z.enum(['CEMENT', 'WATER', 'SAND', 'GRAVEL', 'ADMIXTURE', 'OTHER']),
  targetWeight: z.number().nonnegative(),
  actualWeight: z.number().nonnegative(),
  unit: z.enum(['LB', 'KG']),
  tolerance: z.number().nonnegative().optional(),
  recordedAt: z.string().datetime({ offset: true }),
});

export const RecordScaleReadingBody = z.union([
  ScaleReadingItem,
  z.array(ScaleReadingItem).min(1),
]);

export type RecordScaleReadingBody = z.infer<typeof RecordScaleReadingBody>;

export const ScaleReadingQueryParams = z.object({
  plantId: z.string().uuid().optional(),
  mixerId: z.string().uuid().optional(),
  batchNumber: z.string().optional(),
  materialType: z.enum(['CEMENT', 'WATER', 'SAND', 'GRAVEL', 'ADMIXTURE', 'OTHER']).optional(),
  withinTolerance: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ScaleReadingQueryParams = z.infer<typeof ScaleReadingQueryParams>;
