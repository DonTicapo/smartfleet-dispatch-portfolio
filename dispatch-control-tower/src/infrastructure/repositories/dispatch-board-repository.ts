import type { Knex } from 'knex';
import type { DispatchBoardEntry } from '../../domain/entities/dispatch-board-entry.js';

function toEntity(row: Record<string, unknown>): DispatchBoardEntry {
  return {
    id: row.id as string, date: row.date as string, loadId: row.load_id as string,
    orderId: row.order_id as string, ticketId: row.ticket_id as string,
    ticketNumber: row.ticket_number as string, customerName: row.customer_name as string,
    siteName: row.site_name as string, mixDesignCode: row.mix_design_code as string,
    requestedQuantityAmount: row.requested_quantity_amount ? parseFloat(row.requested_quantity_amount as string) : null,
    requestedQuantityUnit: (row.requested_quantity_unit as string) || 'M3',
    loadStatus: row.load_status as string, truckId: row.truck_id as string | null,
    truckNumber: row.truck_number as string | null, driverId: row.driver_id as string | null,
    driverName: row.driver_name as string | null, assignmentId: row.assignment_id as string | null,
    assignmentStatus: row.assignment_status as string | null,
    scheduledTime: row.scheduled_time as string | null,
    hasExceptions: row.has_exceptions as boolean,
    lastRefreshedAt: row.last_refreshed_at as Date,
  };
}

export class DispatchBoardRepository {
  constructor(private db: Knex) {}

  async upsert(entry: Record<string, unknown>): Promise<void> {
    await this.db.raw(
      `INSERT INTO dispatch_board (date, load_id, order_id, ticket_id, ticket_number, customer_name, site_name,
        mix_design_code, requested_quantity_amount, requested_quantity_unit, load_status,
        truck_id, truck_number, driver_id, driver_name, assignment_id, assignment_status,
        scheduled_time, has_exceptions, last_refreshed_at)
       VALUES (:date, :load_id, :order_id, :ticket_id, :ticket_number, :customer_name, :site_name,
        :mix_design_code, :requested_quantity_amount, :requested_quantity_unit, :load_status,
        :truck_id, :truck_number, :driver_id, :driver_name, :assignment_id, :assignment_status,
        :scheduled_time, :has_exceptions, now())
       ON CONFLICT (date, load_id) DO UPDATE SET
        load_status = EXCLUDED.load_status, truck_id = EXCLUDED.truck_id, truck_number = EXCLUDED.truck_number,
        driver_id = EXCLUDED.driver_id, driver_name = EXCLUDED.driver_name,
        assignment_id = EXCLUDED.assignment_id, assignment_status = EXCLUDED.assignment_status,
        has_exceptions = EXCLUDED.has_exceptions, last_refreshed_at = now()`,
      entry,
    );
  }

  async findByDate(date: string): Promise<DispatchBoardEntry[]> {
    const rows = await this.db('dispatch_board').where({ date }).orderBy('ticket_number');
    return rows.map(toEntity);
  }
}
