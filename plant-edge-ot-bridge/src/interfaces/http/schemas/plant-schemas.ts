import { z } from 'zod';

export const CreatePlantBody = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lon: z.number().min(-180).max(180),
      address: z.string().nullable().default(null),
    })
    .nullish(),
  timezone: z.string().min(1).default('America/Chicago'),
});

export type CreatePlantBody = z.infer<typeof CreatePlantBody>;

export const CreateMixerBody = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  type: z.enum(['DRUM', 'CENTRAL', 'CONTINUOUS']),
  capacityCy: z.number().positive(),
});

export type CreateMixerBody = z.infer<typeof CreateMixerBody>;

export const UpdateMixerBody = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(['DRUM', 'CENTRAL', 'CONTINUOUS']).optional(),
  capacityCy: z.number().positive().optional(),
});

export type UpdateMixerBody = z.infer<typeof UpdateMixerBody>;
