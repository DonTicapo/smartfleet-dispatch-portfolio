import { z } from 'zod';

export const CreateTruckBody = z.object({
  number: z.string().min(1), externalId: z.string().nullish(), licensePlate: z.string().nullish(),
  capacityAmount: z.number().positive().nullish(), capacityUnit: z.enum(['CY', 'CM']).default('CY'),
  homePlantId: z.string().nullish(), notes: z.string().nullish(),
});

export const UpdateTruckBody = z.object({
  status: z.enum(['AVAILABLE', 'ASSIGNED', 'OUT_OF_SERVICE', 'MAINTENANCE']).optional(),
  notes: z.string().nullish(), licensePlate: z.string().nullish(),
});
