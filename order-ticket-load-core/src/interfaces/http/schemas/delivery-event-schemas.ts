import { z } from 'zod';

export const RecordDeliveryEventBody = z.object({
  eventId: z.string().min(1),
  loadId: z.string().uuid(),
  state: z.enum([
    'PLANT_DEPARTED',
    'GEOFENCE_ENTERED',
    'ON_SITE_ARRIVED',
    'POUR_STARTED',
    'POUR_COMPLETED',
    'SITE_DEPARTED',
    'PLANT_RETURNED',
    'WASHOUT_COMPLETED',
  ]),
  occurredAt: z.string().datetime(),
  source: z.string().min(1),
  sourceEventId: z.string().nullish(),
  payload: z.record(z.unknown()).nullish(),
});

export type RecordDeliveryEventBody = z.infer<typeof RecordDeliveryEventBody>;
