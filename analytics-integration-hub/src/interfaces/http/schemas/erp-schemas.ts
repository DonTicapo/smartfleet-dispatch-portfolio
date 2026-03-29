import { z } from 'zod';
import { ExportType } from '../../../domain/enums/export-type.js';

export const CreateErpExportBody = z.object({
  exportType: z.nativeEnum(ExportType),
  filters: z.record(z.unknown()).default({}),
});

export type CreateErpExportBody = z.infer<typeof CreateErpExportBody>;

export const ListExportsQueryParams = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListExportsQueryParams = z.infer<typeof ListExportsQueryParams>;
