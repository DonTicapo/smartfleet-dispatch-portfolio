import { z } from 'zod';

export const SyncTripsBody = z.object({
  trackerAssetId: z.string().uuid().optional(),
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export const RouteByTripBody = z.object({
  tripId: z.string().uuid(),
});

export const GeofenceEventBody = z.object({
  trackerAssetId: z.string().uuid(),
  geofenceZoneId: z.string().uuid(),
  transition: z.enum(['ENTER', 'EXIT']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  occurredAt: z.string().datetime(),
  navixyEventId: z.string().optional(),
});

export type SyncTripsBody = z.infer<typeof SyncTripsBody>;
export type RouteByTripBody = z.infer<typeof RouteByTripBody>;
export type GeofenceEventBody = z.infer<typeof GeofenceEventBody>;
