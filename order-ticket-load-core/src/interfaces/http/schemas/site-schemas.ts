import { z } from 'zod';

export const CreateSiteBody = z.object({
  customerId: z.string().uuid(),
  name: z.string().min(1),
  address: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().length(2),
  }),
  geoPoint: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .nullish(),
  geofenceRadiusMeters: z.number().int().positive().nullish(),
  notes: z.string().nullish(),
});

export type CreateSiteBody = z.infer<typeof CreateSiteBody>;
