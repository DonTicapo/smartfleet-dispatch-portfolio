import type { ExportType } from '../enums/export-type.js';
import type { ExportStatus } from '../enums/export-status.js';

export interface ErpExportJob {
  id: string;
  exportType: ExportType;
  status: ExportStatus;
  filters: Record<string, unknown>;
  resultUrl: string | null;
  errorMessage: string | null;
  requestedBy: string;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}
