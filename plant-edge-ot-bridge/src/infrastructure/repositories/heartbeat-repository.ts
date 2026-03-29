import type { Knex } from 'knex';
import type { Heartbeat } from '../../domain/entities/heartbeat.js';

interface HeartbeatRow {
  id: string;
  plant_id: string;
  uptime_seconds: number;
  cpu_percent: string;
  memory_percent: string;
  disk_percent: string;
  pending_outbound: number;
  last_cloud_sync_at: Date | null;
  reported_at: Date;
}

function toEntity(row: HeartbeatRow): Heartbeat {
  return {
    id: row.id,
    plantId: row.plant_id,
    uptimeSeconds: row.uptime_seconds,
    cpuPercent: parseFloat(row.cpu_percent),
    memoryPercent: parseFloat(row.memory_percent),
    diskPercent: parseFloat(row.disk_percent),
    pendingOutbound: row.pending_outbound,
    lastCloudSyncAt: row.last_cloud_sync_at,
    reportedAt: row.reported_at,
  };
}

export class HeartbeatRepository {
  constructor(private db: Knex) {}

  async create(
    data: Omit<Heartbeat, 'id'>,
    trx?: Knex.Transaction,
  ): Promise<Heartbeat> {
    const qb = trx || this.db;
    const [row] = await qb('heartbeats')
      .insert({
        plant_id: data.plantId,
        uptime_seconds: data.uptimeSeconds,
        cpu_percent: data.cpuPercent,
        memory_percent: data.memoryPercent,
        disk_percent: data.diskPercent,
        pending_outbound: data.pendingOutbound,
        last_cloud_sync_at: data.lastCloudSyncAt,
        reported_at: data.reportedAt,
      })
      .returning('*');
    return toEntity(row);
  }

  async findLatestByPlantId(plantId: string): Promise<Heartbeat | null> {
    const row = await this.db('heartbeats')
      .where({ plant_id: plantId })
      .orderBy('reported_at', 'desc')
      .first();
    return row ? toEntity(row) : null;
  }

  async findByPlantId(
    plantId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Heartbeat[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const rows = await this.db('heartbeats')
      .where({ plant_id: plantId })
      .orderBy('reported_at', 'desc')
      .limit(limit)
      .offset(offset);
    return rows.map(toEntity);
  }
}
