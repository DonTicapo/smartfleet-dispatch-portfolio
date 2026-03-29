import { z } from 'zod';
import { KpiDimension } from '../../../domain/enums/kpi-dimension.js';

export const CreateKpiDefinitionBody = z.object({
  name: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, 'KPI name must be snake_case'),
  displayName: z.string().min(1),
  description: z.string().min(1),
  unit: z.string().min(1),
  dimension: z.nativeEnum(KpiDimension),
  formula: z.string().min(1),
  isActive: z.boolean().default(true),
});

export type CreateKpiDefinitionBody = z.infer<typeof CreateKpiDefinitionBody>;

export const ComputeKpiBody = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  dimension: z.nativeEnum(KpiDimension),
  dimensionId: z.string().optional(),
});

export type ComputeKpiBody = z.infer<typeof ComputeKpiBody>;

export const KpiSnapshotQueryParams = z.object({
  kpiName: z.string().optional(),
  dimension: z.nativeEnum(KpiDimension).optional(),
  dimensionId: z.string().optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export type KpiSnapshotQueryParams = z.infer<typeof KpiSnapshotQueryParams>;
