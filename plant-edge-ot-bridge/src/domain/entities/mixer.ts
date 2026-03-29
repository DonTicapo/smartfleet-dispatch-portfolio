import type { MixerType } from '../enums/mixer-type.js';
import type { MixerStatus } from '../enums/mixer-status.js';

export interface Mixer {
  id: string;
  plantId: string;
  code: string;
  name: string;
  type: MixerType;
  capacityCy: number;
  status: MixerStatus;
  lastStatusAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
