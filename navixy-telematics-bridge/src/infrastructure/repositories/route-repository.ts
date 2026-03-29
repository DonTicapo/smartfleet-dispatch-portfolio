import type { Knex } from 'knex';
import type { Route, RoutePoint } from '../../domain/entities/route.js';

interface RouteRow {
  id: string;
  trip_id: string;
  points: RoutePoint[];
  fetched_at: Date;
}

function toEntity(row: RouteRow): Route {
  return {
    id: row.id,
    tripId: row.trip_id,
    points: row.points,
    fetchedAt: row.fetched_at,
  };
}

export class RouteRepository {
  constructor(private db: Knex) {}

  async upsert(tripId: string, points: RoutePoint[]): Promise<Route> {
    const result = await this.db.raw(
      `INSERT INTO routes (trip_id, points, fetched_at)
       VALUES (?, ?::jsonb, now())
       ON CONFLICT (trip_id) DO UPDATE SET points = EXCLUDED.points, fetched_at = now()
       RETURNING *`,
      [tripId, JSON.stringify(points)],
    );
    return toEntity(result.rows[0]);
  }

  async findByTripId(tripId: string): Promise<Route | null> {
    const row = await this.db('routes').where({ trip_id: tripId }).first();
    return row ? toEntity(row) : null;
  }
}
