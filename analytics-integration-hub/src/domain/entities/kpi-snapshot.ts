import type { KpiDimension } from '../enums/kpi-dimension.js';

export interface KpiSnapshot {
  id: string;
  kpiName: string;
  dimension: KpiDimension;
  dimensionId: string;
  value: number;
  unit: string;
  periodStart: Date;
  periodEnd: Date;
  computedAt: Date;
  createdAt: Date;
}
