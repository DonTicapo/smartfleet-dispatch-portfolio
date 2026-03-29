import { z } from 'zod';

export const RecordHeartbeatBody = z.object({
  plantId: z.string().uuid(),
  uptimeSeconds: z.number().int().nonnegative(),
  cpuPercent: z.number().min(0).max(100),
  memoryPercent: z.number().min(0).max(100),
  diskPercent: z.number().min(0).max(100),
  pendingOutbound: z.number().int().nonnegative(),
  lastCloudSyncAt: z.string().datetime({ offset: true }).nullish(),
});

export type RecordHeartbeatBody = z.infer<typeof RecordHeartbeatBody>;
