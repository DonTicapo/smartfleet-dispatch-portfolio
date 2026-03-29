import type { KpiDimension } from '../enums/kpi-dimension.js';

export interface KpiDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  unit: string;
  dimension: KpiDimension;
  formula: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
