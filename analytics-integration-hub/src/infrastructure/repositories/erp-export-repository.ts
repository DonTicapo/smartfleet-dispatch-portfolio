import type { Knex } from 'knex';
import type { ErpExportJob } from '../../domain/entities/erp-export-job.js';
import type { ExportType } from '../../domain/enums/export-type.js';
import type { ExportStatus } from '../../domain/enums/export-status.js';

interface ErpExportJobRow {
  id: string;
  export_type: string;
  status: string;
  filters: Record<string, unknown>;
  result_url: string | null;
  error_message: string | null;
  requested_by: string;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
}

function toEntity(row: ErpExportJobRow): ErpExportJob {
  return {
    id: row.id,
    exportType: row.export_type as ExportType,
    status: row.status as ExportStatus,
    filters: row.filters,
    resultUrl: row.result_url,
    errorMessage: row.error_message,
    requestedBy: row.requested_by,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

export class ErpExportRepository {
  constructor(private db: Knex) {}

  async create(
    data: { exportType: ExportType; filters: Record<string, unknown>; requestedBy: string },
    trx?: Knex.Transaction,
  ): Promise<ErpExportJob> {
    const qb = trx || this.db;
    const [row] = await qb('erp_export_jobs')
      .insert({
        export_type: data.exportType,
        filters: JSON.stringify(data.filters),
        requested_by: data.requestedBy,
        status: 'PENDING',
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<ErpExportJob | null> {
    const row = await this.db('erp_export_jobs').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async list(limit: number = 50, offset: number = 0): Promise<ErpExportJob[]> {
    const rows = await this.db('erp_export_jobs')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
    return rows.map(toEntity);
  }

  async updateStatus(
    id: string,
    status: ExportStatus,
    extra: { resultUrl?: string; errorMessage?: string; startedAt?: Date; completedAt?: Date } = {},
    trx?: Knex.Transaction,
  ): Promise<ErpExportJob | null> {
    const qb = trx || this.db;
    const updates: Record<string, unknown> = { status };
    if (extra.resultUrl !== undefined) updates.result_url = extra.resultUrl;
    if (extra.errorMessage !== undefined) updates.error_message = extra.errorMessage;
    if (extra.startedAt !== undefined) updates.started_at = extra.startedAt;
    if (extra.completedAt !== undefined) updates.completed_at = extra.completedAt;

    const [row] = await qb('erp_export_jobs')
      .where({ id })
      .update(updates)
      .returning('*');
    return row ? toEntity(row) : null;
  }
}
