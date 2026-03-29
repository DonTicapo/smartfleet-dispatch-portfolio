import type { MixerStatus } from '../enums/mixer-status.js';

export interface MixerStatusLog {
  id: string;
  plantId: string;
  mixerId: string;
  previousStatus: MixerStatus | null;
  currentStatus: MixerStatus;
  reason: string | null;
  operatorId: string | null;
  occurredAt: Date;
  receivedAt: Date;
}
