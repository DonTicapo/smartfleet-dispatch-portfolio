import { z } from 'zod';

export const CreateAssignmentBody = z.object({
  loadId: z.string().min(1), truckId: z.string().uuid(), driverId: z.string().uuid(), notes: z.string().nullish(),
});

export const CancelAssignmentBody = z.object({ reason: z.string().min(1) });

export const CreateExceptionBody = z.object({
  loadId: z.string().nullish(), assignmentId: z.string().uuid().nullish(), truckId: z.string().uuid().nullish(),
  type: z.enum(['DELAY', 'NO_SHOW', 'PLANT_ISSUE', 'ASSET_FAILURE', 'DRIVER_ISSUE', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  title: z.string().min(1), description: z.string().nullish(),
});

export const UpdateExceptionBody = z.object({
  status: z.enum(['ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  resolution: z.string().nullish(),
});

export const RefreshBoardBody = z.object({ date: z.string().optional() });
