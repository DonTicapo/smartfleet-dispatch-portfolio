import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Knex } from 'knex';
import { setupTestDb, teardownTestDb, makeIngestEvent, makeKpiDefinition, makeWebhookSubscription } from '../helpers/test-utils.js';

let db: Knex;

describe('Analytics Integration Hub — Full Vertical Slice', () => {
  beforeAll(async () => {
    db = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it('ingests events with idempotency, creates KPI definitions, and manages webhook subscriptions', async () => {
    // 1. Ingest an event
    const eventData = makeIngestEvent();
    const [event1] = await db('ingest_events').insert(eventData).returning('*');
    expect(event1.id).toBeDefined();
    expect(event1.event_id).toBe(eventData.event_id);
    expect(event1.source).toBe('OTL_CORE');

    // 2. Idempotency: same event_id should not create a new row
    const dupResult = await db.raw(
      `INSERT INTO ingest_events (event_id, source, event_type, aggregate_type, aggregate_id, payload, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?::jsonb, ?)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING *`,
      [
        eventData.event_id,
        eventData.source,
        eventData.event_type,
        eventData.aggregate_type,
        eventData.aggregate_id,
        eventData.payload,
        eventData.occurred_at,
      ],
    );
    expect(dupResult.rows).toHaveLength(0);

    // 3. Ingest a second event
    const event2Data = makeIngestEvent({
      event_type: 'delivery.plant_departed',
      source: 'NAVIXY_BRIDGE',
    });
    const [event2] = await db('ingest_events').insert(event2Data).returning('*');
    expect(event2.source).toBe('NAVIXY_BRIDGE');

    // 4. Query events by source
    const otlEvents = await db('ingest_events').where({ source: 'OTL_CORE' });
    expect(otlEvents.length).toBeGreaterThanOrEqual(1);

    const navixyEvents = await db('ingest_events').where({ source: 'NAVIXY_BRIDGE' });
    expect(navixyEvents.length).toBeGreaterThanOrEqual(1);

    // 5. Create a KPI definition
    const kpiData = makeKpiDefinition({
      name: 'loads_per_day',
      display_name: 'Loads Per Day',
      description: 'Average completed loads per plant per day',
      unit: 'loads/day',
      dimension: 'PLANT',
      formula: 'count(completed_loads) / period_days',
    });
    const [kpiDef] = await db('kpi_definitions').insert(kpiData).returning('*');
    expect(kpiDef.id).toBeDefined();
    expect(kpiDef.name).toBe('loads_per_day');
    expect(kpiDef.is_active).toBe(true);

    // 6. Uniqueness on KPI name
    const dupKpi = await db.raw(
      `INSERT INTO kpi_definitions (name, display_name, description, unit, dimension, formula)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (name) DO NOTHING
       RETURNING *`,
      ['loads_per_day', 'Dup', 'Dup', 'count', 'PLANT', 'dup'],
    );
    expect(dupKpi.rows).toHaveLength(0);

    // 7. Create a KPI snapshot
    const [snapshot] = await db('kpi_snapshots')
      .insert({
        kpi_name: 'loads_per_day',
        dimension: 'PLANT',
        dimension_id: 'plant-001',
        value: 12.5,
        unit: 'loads/day',
        period_start: new Date('2026-03-01'),
        period_end: new Date('2026-03-29'),
      })
      .returning('*');
    expect(snapshot.id).toBeDefined();
    expect(parseFloat(snapshot.value)).toBe(12.5);

    // 8. Create a webhook subscription
    const webhookData = makeWebhookSubscription();
    const [webhook] = await db('webhook_subscriptions').insert(webhookData).returning('*');
    expect(webhook.id).toBeDefined();
    expect(webhook.url).toBe('https://example.com/webhook');
    expect(webhook.is_active).toBe(true);

    // 9. Create a webhook delivery record
    const [delivery] = await db('webhook_deliveries')
      .insert({
        subscription_id: webhook.id,
        event_id: eventData.event_id,
        status: 'PENDING',
        attempts: 0,
      })
      .returning('*');
    expect(delivery.id).toBeDefined();
    expect(delivery.status).toBe('PENDING');

    // 10. Update delivery status
    await db('webhook_deliveries')
      .where({ id: delivery.id })
      .update({ status: 'DELIVERED', http_status: 200, attempts: 1, last_attempt_at: new Date() });
    const updatedDelivery = await db('webhook_deliveries').where({ id: delivery.id }).first();
    expect(updatedDelivery.status).toBe('DELIVERED');
    expect(updatedDelivery.http_status).toBe(200);

    // 11. Create an ERP export job
    const [exportJob] = await db('erp_export_jobs')
      .insert({
        export_type: 'INVOICE',
        status: 'PENDING',
        filters: JSON.stringify({ customerId: 'cust-001', fromDate: '2026-03-01' }),
        requested_by: 'test-user',
      })
      .returning('*');
    expect(exportJob.id).toBeDefined();
    expect(exportJob.status).toBe('PENDING');

    // 12. Update export job to completed
    await db('erp_export_jobs')
      .where({ id: exportJob.id })
      .update({
        status: 'COMPLETED',
        result_url: 'data:application/json;base64,eyJ0ZXN0IjogdHJ1ZX0=',
        started_at: new Date(),
        completed_at: new Date(),
      });
    const completedJob = await db('erp_export_jobs').where({ id: exportJob.id }).first();
    expect(completedJob.status).toBe('COMPLETED');
    expect(completedJob.result_url).toBeDefined();

    // 13. Audit log entries
    await db('audit_log').insert({
      entity_type: 'IngestEvent',
      entity_id: event1.id,
      action: 'INGEST',
      actor: 'test-user',
      changes: JSON.stringify({ source: 'OTL_CORE' }),
    });

    const auditEntries = await db('audit_log').where({ entity_id: event1.id });
    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].action).toBe('INGEST');

    // 14. Query snapshots by dimension
    const plantSnapshots = await db('kpi_snapshots').where({ dimension: 'PLANT' });
    expect(plantSnapshots.length).toBeGreaterThanOrEqual(1);

    // 15. Delete webhook subscription (cascade should remove deliveries)
    await db('webhook_deliveries').where({ subscription_id: webhook.id }).delete();
    const deleted = await db('webhook_subscriptions').where({ id: webhook.id }).delete();
    expect(deleted).toBe(1);

    const remainingWebhooks = await db('webhook_subscriptions').where({ id: webhook.id });
    expect(remainingWebhooks).toHaveLength(0);
  });

  it('handles event date range queries', async () => {
    // Insert events with specific timestamps
    const earlyEvent = makeIngestEvent({
      occurred_at: new Date('2026-01-15T10:00:00Z'),
      event_type: 'load.created',
    });
    const lateEvent = makeIngestEvent({
      occurred_at: new Date('2026-03-15T10:00:00Z'),
      event_type: 'load.created',
    });

    await db('ingest_events').insert(earlyEvent);
    await db('ingest_events').insert(lateEvent);

    // Query with date range
    const results = await db('ingest_events')
      .where('event_type', 'load.created')
      .where('occurred_at', '>=', new Date('2026-03-01'))
      .where('occurred_at', '<=', new Date('2026-03-31'));

    expect(results.length).toBeGreaterThanOrEqual(1);
    for (const r of results) {
      const ts = new Date(r.occurred_at);
      expect(ts.getTime()).toBeGreaterThanOrEqual(new Date('2026-03-01').getTime());
    }
  });

  it('stores KPI snapshots with correct numeric precision', async () => {
    const [snapshot] = await db('kpi_snapshots')
      .insert({
        kpi_name: 'avg_delivery_time_minutes',
        dimension: 'FLEET',
        dimension_id: 'truck-001',
        value: 42.1234,
        unit: 'minutes',
        period_start: new Date('2026-03-01'),
        period_end: new Date('2026-03-29'),
      })
      .returning('*');

    expect(parseFloat(snapshot.value)).toBe(42.1234);
  });
});
