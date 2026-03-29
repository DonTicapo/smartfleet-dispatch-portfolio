import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data in reverse dependency order
  await knex('audit_log').del();
  await knex('outbound_events').del();
  await knex('geofence_events').del();
  await knex('geofence_zones').del();
  await knex('routes').del();
  await knex('trips').del();
  await knex('positions').del();
  await knex('tracker_assets').del();

  // --- Tracker Assets (4 trucks) ---
  await knex('tracker_assets').insert([
    {
      id: '22222222-2222-2222-2222-222222221001',
      navixy_tracker_id: 50101,
      label: 'Truck-101',
      truck_id: 'TRK-101',
      model: 'Teltonika FMB920',
      status: 'ACTIVE',
      last_latitude: 32.7850,
      last_longitude: -96.8100,
      last_position_at: '2026-03-28T07:50:00Z',
      synced_at: '2026-03-28T07:50:00Z',
      created_at: '2026-01-10T08:00:00Z',
      updated_at: '2026-03-28T07:50:00Z',
    },
    {
      id: '22222222-2222-2222-2222-222222221002',
      navixy_tracker_id: 50102,
      label: 'Truck-102',
      truck_id: 'TRK-102',
      model: 'Teltonika FMB920',
      status: 'ACTIVE',
      last_latitude: 32.7770,
      last_longitude: -96.7975,
      last_position_at: '2026-03-28T07:48:00Z',
      synced_at: '2026-03-28T07:48:00Z',
      created_at: '2026-01-10T08:00:00Z',
      updated_at: '2026-03-28T07:48:00Z',
    },
    {
      id: '22222222-2222-2222-2222-222222221003',
      navixy_tracker_id: 50103,
      label: 'Truck-103',
      truck_id: 'TRK-103',
      model: 'Teltonika FMB920',
      status: 'ACTIVE',
      last_latitude: 32.7900,
      last_longitude: -96.8250,
      last_position_at: '2026-03-28T07:45:00Z',
      synced_at: '2026-03-28T07:45:00Z',
      created_at: '2026-01-12T08:00:00Z',
      updated_at: '2026-03-28T07:45:00Z',
    },
    {
      id: '22222222-2222-2222-2222-222222221004',
      navixy_tracker_id: 50104,
      label: 'Truck-104',
      truck_id: 'TRK-104',
      model: 'Queclink GV300',
      status: 'ACTIVE',
      last_latitude: 32.8200,
      last_longitude: -96.8500,
      last_position_at: '2026-03-28T07:30:00Z',
      synced_at: '2026-03-28T07:30:00Z',
      created_at: '2026-02-01T08:00:00Z',
      updated_at: '2026-03-28T07:30:00Z',
    },
  ]);

  // --- Trips (1 completed, 1 in progress) ---
  await knex('trips').insert([
    {
      id: '22222222-2222-2222-2222-222222222001',
      tracker_asset_id: '22222222-2222-2222-2222-222222221001',
      navixy_trip_id: 90001,
      start_at: '2026-03-28T06:55:00Z',
      end_at: '2026-03-28T08:15:00Z',
      start_latitude: 32.8200,
      start_longitude: -96.8500,
      end_latitude: 32.8200,
      end_longitude: -96.8500,
      distance_meters: 28400,
      status: 'COMPLETED',
      load_id: '11111111-1111-1111-1111-111111117001',
      synced_at: '2026-03-28T08:20:00Z',
      created_at: '2026-03-28T06:55:00Z',
      updated_at: '2026-03-28T08:20:00Z',
    },
    {
      id: '22222222-2222-2222-2222-222222222002',
      tracker_asset_id: '22222222-2222-2222-2222-222222221003',
      navixy_trip_id: 90002,
      start_at: '2026-03-28T07:28:00Z',
      start_latitude: 32.8200,
      start_longitude: -96.8500,
      status: 'IN_PROGRESS',
      load_id: '11111111-1111-1111-1111-111111117003',
      synced_at: '2026-03-28T07:45:00Z',
      created_at: '2026-03-28T07:28:00Z',
      updated_at: '2026-03-28T07:45:00Z',
    },
  ]);

  // --- Geofence Zones (matching OTL Core sites) ---
  await knex('geofence_zones').insert([
    {
      id: '22222222-2222-2222-2222-222222223001',
      navixy_geofence_id: 70001,
      name: 'Acme Downtown Tower',
      zone_type: 'JOBSITE',
      latitude: 32.7767,
      longitude: -96.7970,
      radius_meters: 200,
      site_id: '11111111-1111-1111-1111-111111112001',
      created_at: '2026-01-20T10:00:00Z',
      updated_at: '2026-01-20T10:00:00Z',
    },
    {
      id: '22222222-2222-2222-2222-222222223002',
      navixy_geofence_id: 70002,
      name: 'Riverside Plant Yard',
      zone_type: 'PLANT',
      latitude: 32.8200,
      longitude: -96.8500,
      radius_meters: 150,
      plant_id: 'PLT-RIVER',
      created_at: '2026-01-20T10:05:00Z',
      updated_at: '2026-01-20T10:05:00Z',
    },
  ]);

  // --- Geofence Events (ENTER/EXIT transitions) ---
  await knex('geofence_events').insert([
    {
      id: '22222222-2222-2222-2222-222222224001',
      tracker_asset_id: '22222222-2222-2222-2222-222222221001',
      geofence_zone_id: '22222222-2222-2222-2222-222222223002',
      transition: 'EXIT',
      latitude: 32.8198,
      longitude: -96.8495,
      occurred_at: '2026-03-28T06:55:00Z',
      navixy_event_id: 'nav-evt-80001',
      processed_at: '2026-03-28T06:55:30Z',
      created_at: '2026-03-28T06:55:30Z',
    },
    {
      id: '22222222-2222-2222-2222-222222224002',
      tracker_asset_id: '22222222-2222-2222-2222-222222221001',
      geofence_zone_id: '22222222-2222-2222-2222-222222223001',
      transition: 'ENTER',
      latitude: 32.7769,
      longitude: -96.7972,
      occurred_at: '2026-03-28T07:20:00Z',
      navixy_event_id: 'nav-evt-80002',
      processed_at: '2026-03-28T07:20:15Z',
      created_at: '2026-03-28T07:20:15Z',
    },
    {
      id: '22222222-2222-2222-2222-222222224003',
      tracker_asset_id: '22222222-2222-2222-2222-222222221001',
      geofence_zone_id: '22222222-2222-2222-2222-222222223001',
      transition: 'EXIT',
      latitude: 32.7765,
      longitude: -96.7968,
      occurred_at: '2026-03-28T07:50:00Z',
      navixy_event_id: 'nav-evt-80003',
      processed_at: '2026-03-28T07:50:20Z',
      created_at: '2026-03-28T07:50:20Z',
    },
  ]);
}
