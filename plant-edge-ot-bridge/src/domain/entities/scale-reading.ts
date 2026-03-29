import type { MaterialType } from '../enums/material-type.js';
import type { WeightUnit } from '../enums/weight-unit.js';

export interface ScaleReading {
  id: string;
  plantId: string;
  mixerId: string;
  batchNumber: string | null;
  materialType: MaterialType;
  targetWeight: number;
  actualWeight: number;
  unit: WeightUnit;
  tolerance: number;
  withinTolerance: boolean;
  recordedAt: Date;
  receivedAt: Date;
}
