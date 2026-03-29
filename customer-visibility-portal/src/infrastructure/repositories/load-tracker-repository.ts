import type { Knex } from 'knex';
import type { LoadTracker } from '../../domain/entities/load-tracker.js';
import type { LoadTrackerStatus } from '../../domain/enums/load-tracker-status.js';

interface LoadTrackerRow {
  id: string;
  external_load_id: string;
  ticket_id: string;
  load_number: number;
  truck_id: string | null;
  driver_id: string | null;
  status: string;
  current_lat: string | null;
  current_lon: string | null;
  eta_minutes: number | null;
  last_position_at: Date | null;
  last_synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: LoadTrackerRow): LoadTracker {
  return {
    id: row.id,
    externalLoadId: row.external_load_id,
    ticketId: row.ticket_id,
    loadNumber: row.load_number,
    truckId: row.truck_id,
    driverId: row.driver_id,
    status: row.status as LoadTrackerStatus,
    currentLat: row.current_lat ? parseFloat(row.current_lat) : null,
    currentLon: row.current_lon ? parseFloat(row.current_lon) : null,
    etaMinutes: row.eta_minutes,
    lastPositionAt: row.last_position_at,
    lastSyncedAt: row.last_synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class LoadTrackerRepository {
  constructor(private db: Knex) {}

  async upsert(
    data: Omit<LoadTracker, 'id' | 'createdAt' | 'updatedAt'>,
    trx?: Knex.Transaction,
  ): Promise<LoadTracker> {
    const qb = trx || this.db;
    const insertData = {
      external_load_id: data.externalLoadId,
      ticket_id: data.ticketId,
      load_number: data.loadNumber,
      truck_id: data.truckId,
      driver_id: data.driverId,
      status: data.status,
      current_lat: data.currentLat,
      current_lon: data.currentLon,
      eta_minutes: data.etaMinutes,
      last_position_at: data.lastPositionAt,
      last_synced_at: data.lastSyncedAt,
    };

    const [row] = await qb('load_trackers')
      .insert(insertData)
      .onConflict('external_load_id')
      .merge({
        ...insertData,
        updated_at: new Date(),
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<LoadTracker | null> {
    const row = await this.db('load_trackers').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findByExternalId(externalLoadId: string): Promise<LoadTracker | null> {
    const row = await this.db('load_trackers')
      .where({ external_load_id: externalLoadId })
      .first();
    return row ? toEntity(row) : null;
  }

  async listByTicketId(ticketId: string): Promise<LoadTracker[]> {
    const rows = await this.db('load_trackers')
      .where({ ticket_id: ticketId })
      .orderBy('load_number', 'asc');
    return rows.map(toEntity);
  }

  async updatePosition(
    id: string,
    lat: number,
    lon: number,
    etaMinutes: number | null,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const qb = trx || this.db;
    await qb('load_trackers').where({ id }).update({
      current_lat: lat,
      current_lon: lon,
      eta_minutes: etaMinutes,
      last_position_at: new Date(),
      updated_at: new Date(),
    });
  }

  async updateStatus(
    id: string,
    status: LoadTrackerStatus,
    trx?: Knex.Transaction,
  ): Promise<void> {
    const qb = trx || this.db;
    await qb('load_trackers').where({ id }).update({ status, updated_at: new Date() });
  }

  async listActiveByCustomer(customerId: string): Promise<LoadTracker[]> {
    const rows = await this.db('load_trackers as lt')
      .join('ticket_views as tv', 'lt.ticket_id', 'tv.id')
      .join('order_views as ov', 'tv.order_id', 'ov.id')
      .where('ov.customer_id', customerId)
      .whereNotIn('lt.status', ['COMPLETED'])
      .select('lt.*')
      .orderBy('lt.load_number', 'asc');
    return rows.map(toEntity);
  }
}
