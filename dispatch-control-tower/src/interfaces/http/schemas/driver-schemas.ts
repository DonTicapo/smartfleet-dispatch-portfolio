import { z } from 'zod';

export const CreateDriverBody = z.object({
  firstName: z.string().min(1), lastName: z.string().min(1), externalId: z.string().nullish(),
  phone: z.string().nullish(), licenseNumber: z.string().nullish(),
  defaultTruckId: z.string().uuid().nullish(), notes: z.string().nullish(),
});

export const UpdateDriverBody = z.object({
  status: z.enum(['AVAILABLE', 'ASSIGNED', 'OFF_DUTY', 'SUSPENDED']).optional(),
  notes: z.string().nullish(), phone: z.string().nullish(),
});
