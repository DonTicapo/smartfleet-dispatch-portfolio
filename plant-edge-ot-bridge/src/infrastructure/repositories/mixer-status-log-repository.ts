import type { Knex } from 'knex';
import type { MixerStatusLog } from '../../domain/entities/mixer-status-log.js';
import type { MixerStatus } from '../../domain/enums/mixer-status.js';

interface MixerStatusLogRow {
  id: string;
  plant_id: string;
  mixer_id: string;
  previous_status: string | null;
  current_status: string;
  reason: string | null;
  operator_id: string | null;
  occurred_at: Date;
  received_at: Date;
}

function toEntity(row: MixerStatusLogRow): MixerStatusLog {
  return {
    id: row.id,
    plantId: row.plant_id,
    mixerId: row.mixer_id,
    previousStatus: row.previous_status as MixerStatus | null,
    currentStatus: row.current_status as MixerStatus,
    reason: row.reason,
    operatorId: row.operator_id,
    occurredAt: row.occurred_at,
    receivedAt: row.received_at,
  };
}

export class MixerStatusLogRepository {
  constructor(private db: Knex) {}

  async create(
    data: Omit<MixerStatusLog, 'id' | 'receivedAt'>,
    trx?: Knex.Transaction,
  ): Promise<MixerStatusLog> {
    const qb = trx || this.db;
    const [row] = await qb('mixer_status_log')
      .insert({
        plant_id: data.plantId,
        mixer_id: data.mixerId,
        previous_status: data.previousStatus,
        current_status: data.currentStatus,
        reason: data.reason,
        operator_id: data.operatorId,
        occurred_at: data.occurredAt,
      })
      .returning('*');
    return toEntity(row);
  }

  async findLatestByMixerId(mixerId: string): Promise<MixerStatusLog | null> {
    const row = await this.db('mixer_status_log')
      .where({ mixer_id: mixerId })
      .orderBy('occurred_at', 'desc')
      .first();
    return row ? toEntity(row) : null;
  }

  async findByMixerId(
    mixerId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<MixerStatusLog[]> {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;
    const rows = await this.db('mixer_status_log')
      .where({ mixer_id: mixerId })
      .orderBy('occurred_at', 'desc')
      .limit(limit)
      .offset(offset);
    return rows.map(toEntity);
  }
}
