import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Knex } from 'knex';
import { randomUUID } from 'crypto';
import { setupTestDb, teardownTestDb, makePlant, makeMixer, makeBatchEvent, makeScaleReading } from '../helpers/test-utils.js';

let db: Knex;

describe('Plant Edge OT Bridge — Full Vertical Slice', () => {
  beforeAll(async () => {
    db = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it('creates plant -> mixer -> batch events -> scale readings -> status transitions -> heartbeat -> outbound queue', async () => {
    // 1. Create plant
    const [plant] = await db('plants').insert(makePlant()).returning('*');
    expect(plant.id).toBeDefined();
    expect(plant.code).toMatch(/^PLT-/);
    expect(plant.is_active).toBe(true);

    // 2. Create mixer
    const [mixer] = await db('mixers').insert(makeMixer(plant.id)).returning('*');
    expect(mixer.id).toBeDefined();
    expect(mixer.plant_id).toBe(plant.id);
    expect(mixer.status).toBe('IDLE');

    // 3. Record batch events (idempotent by event_id)
    const eventId1 = `evt-${randomUUID().slice(0, 8)}`;
    const [batchEvt1] = await db('batch_events')
      .insert(
        makeBatchEvent(plant.id, mixer.id, {
          event_id: eventId1,
          event_type: 'BATCH_STARTED',
          batch_number: 'B-001',
          occurred_at: new Date('2026-03-29T08:00:00Z'),
        }),
      )
      .returning('*');
    expect(batchEvt1.event_id).toBe(eventId1);
    expect(batchEvt1.event_type).toBe('BATCH_STARTED');

    // Test idempotency: inserting same event_id should conflict
    const dupResult = await db.raw(
      `INSERT INTO batch_events (event_id, plant_id, mixer_id, batch_number, event_type, payload, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING *`,
      [eventId1, plant.id, mixer.id, 'B-001', 'BATCH_STARTED', '{}', new Date('2026-03-29T08:00:00Z')],
    );
    expect(dupResult.rows).toHaveLength(0);

    // Record BATCH_COMPLETE
    const [batchEvt2] = await db('batch_events')
      .insert(
        makeBatchEvent(plant.id, mixer.id, {
          event_type: 'BATCH_COMPLETE',
          batch_number: 'B-001',
          occurred_at: new Date('2026-03-29T08:05:00Z'),
          payload: JSON.stringify({ durationSeconds: 300 }),
        }),
      )
      .returning('*');
    expect(batchEvt2.event_type).toBe('BATCH_COMPLETE');

    // 4. Record scale readings — within tolerance
    const [reading1] = await db('scale_readings')
      .insert(
        makeScaleReading(plant.id, mixer.id, {
          batch_number: 'B-001',
          material_type: 'CEMENT',
          target_weight: 1000.0,
          actual_weight: 1015.0,
          tolerance: 2.0,
          within_tolerance: true, // 15/1000 = 1.5% < 2%
          recorded_at: new Date('2026-03-29T08:01:00Z'),
        }),
      )
      .returning('*');
    expect(reading1.within_tolerance).toBe(true);

    // Record scale reading — out of tolerance
    const [reading2] = await db('scale_readings')
      .insert(
        makeScaleReading(plant.id, mixer.id, {
          batch_number: 'B-001',
          material_type: 'CEMENT',
          target_weight: 1000.0,
          actual_weight: 1050.0,
          tolerance: 2.0,
          within_tolerance: false, // 50/1000 = 5% > 2%
          recorded_at: new Date('2026-03-29T08:01:30Z'),
        }),
      )
      .returning('*');
    expect(reading2.within_tolerance).toBe(false);

    // 5. Mixer status transitions: IDLE -> MIXING -> IDLE
    // Record first transition
    const [statusLog1] = await db('mixer_status_log')
      .insert({
        plant_id: plant.id,
        mixer_id: mixer.id,
        previous_status: 'IDLE',
        current_status: 'MIXING',
        reason: 'Batch B-001 started',
        occurred_at: new Date('2026-03-29T08:00:00Z'),
      })
      .returning('*');
    await db('mixers').where({ id: mixer.id }).update({ status: 'MIXING', last_status_at: new Date(), updated_at: new Date() });

    expect(statusLog1.previous_status).toBe('IDLE');
    expect(statusLog1.current_status).toBe('MIXING');

    // Record second transition (back to IDLE)
    const [statusLog2] = await db('mixer_status_log')
      .insert({
        plant_id: plant.id,
        mixer_id: mixer.id,
        previous_status: 'MIXING',
        current_status: 'IDLE',
        reason: 'Batch B-001 complete',
        occurred_at: new Date('2026-03-29T08:05:00Z'),
      })
      .returning('*');
    await db('mixers').where({ id: mixer.id }).update({ status: 'IDLE', last_status_at: new Date(), updated_at: new Date() });

    expect(statusLog2.current_status).toBe('IDLE');

    // 6. Verify status history
    const statusHistory = await db('mixer_status_log')
      .where({ mixer_id: mixer.id })
      .orderBy('occurred_at');
    expect(statusHistory).toHaveLength(2);

    // 7. Create outbound events (store-and-forward)
    const [outbound1] = await db('outbound_events')
      .insert({
        event_type: 'BATCH_EVENT',
        payload: JSON.stringify({ eventId: batchEvt1.event_id, batchNumber: 'B-001' }),
        target_service: 'OTL_CORE',
        status: 'PENDING',
        attempts: 0,
        max_attempts: 5,
      })
      .returning('*');
    expect(outbound1.status).toBe('PENDING');
    expect(outbound1.attempts).toBe(0);

    // Simulate send -> mark as SENT
    await db('outbound_events').where({ id: outbound1.id }).update({
      status: 'SENT',
      sent_at: new Date(),
      attempts: 1,
      last_attempt_at: new Date(),
    });

    const sentEvent = await db('outbound_events').where({ id: outbound1.id }).first();
    expect(sentEvent.status).toBe('SENT');
    expect(sentEvent.attempts).toBe(1);

    // 8. Create and verify failed -> dead-letter outbound event
    const [outbound2] = await db('outbound_events')
      .insert({
        event_type: 'TOLERANCE_VIOLATION',
        payload: JSON.stringify({ readingId: reading2.id }),
        target_service: 'OTL_CORE',
        status: 'FAILED',
        attempts: 5,
        max_attempts: 5,
        last_attempt_at: new Date(),
      })
      .returning('*');
    await db('outbound_events').where({ id: outbound2.id }).update({ status: 'DEAD_LETTER' });

    const deadLetter = await db('outbound_events').where({ id: outbound2.id }).first();
    expect(deadLetter.status).toBe('DEAD_LETTER');

    // 9. Record heartbeat
    const [heartbeat] = await db('heartbeats')
      .insert({
        plant_id: plant.id,
        uptime_seconds: 86400,
        cpu_percent: 42.5,
        memory_percent: 68.3,
        disk_percent: 55.1,
        pending_outbound: 0,
        reported_at: new Date(),
      })
      .returning('*');
    expect(heartbeat.plant_id).toBe(plant.id);
    expect(parseFloat(heartbeat.cpu_percent)).toBeCloseTo(42.5);

    // 10. Verify latest heartbeat
    const latestHeartbeat = await db('heartbeats')
      .where({ plant_id: plant.id })
      .orderBy('reported_at', 'desc')
      .first();
    expect(latestHeartbeat.id).toBe(heartbeat.id);

    // 11. Verify we can query batch events by plant
    const plantBatchEvents = await db('batch_events')
      .where({ plant_id: plant.id })
      .orderBy('occurred_at');
    expect(plantBatchEvents).toHaveLength(2);

    // 12. Verify we can query scale readings by batch
    const batchReadings = await db('scale_readings')
      .where({ batch_number: 'B-001' })
      .orderBy('recorded_at');
    expect(batchReadings).toHaveLength(2);

    // 13. Verify outbound event queue summary
    const queueSummary = await db('outbound_events')
      .select('status')
      .count('* as count')
      .groupBy('status');
    const summaryMap = Object.fromEntries(queueSummary.map((r: Record<string, unknown>) => [r.status as string, Number(r.count)]));
    expect(summaryMap['SENT']).toBe(1);
    expect(summaryMap['DEAD_LETTER']).toBe(1);

    // 14. Verify audit log can store entries
    await db('audit_log').insert({
      entity_type: 'Plant',
      entity_id: plant.id,
      action: 'CREATE',
      actor: 'test-user',
      changes: JSON.stringify({ code: plant.code }),
    });
    const auditEntries = await db('audit_log').where({ entity_id: plant.id });
    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].action).toBe('CREATE');
  });

  it('enforces unique constraints on plants and mixers', async () => {
    const [plant] = await db('plants').insert(makePlant({ code: 'UNIQUE-PLT' })).returning('*');

    // Duplicate plant code should fail
    await expect(
      db('plants').insert(makePlant({ code: 'UNIQUE-PLT' })),
    ).rejects.toThrow();

    // Create mixer
    await db('mixers').insert(makeMixer(plant.id, { code: 'MXR-UNIQUE' }));

    // Duplicate mixer code at same plant should fail
    await expect(
      db('mixers').insert(makeMixer(plant.id, { code: 'MXR-UNIQUE' })),
    ).rejects.toThrow();
  });

  it('validates tolerance calculation math', async () => {
    // Test case: target 1000, actual 1020, tolerance 2%
    // Deviation: 20/1000 = 2% => exactly at boundary
    const target = 1000;
    const actual = 1020;
    const tolerancePct = 2.0;
    const deviation = Math.abs(actual - target);
    const allowed = (tolerancePct / 100) * Math.abs(target);
    expect(deviation).toBe(20);
    expect(allowed).toBe(20);
    expect(deviation <= allowed).toBe(true); // Within tolerance (boundary)

    // Test case: target 1000, actual 1021, tolerance 2%
    const actual2 = 1021;
    const deviation2 = Math.abs(actual2 - target);
    expect(deviation2).toBe(21);
    expect(deviation2 <= allowed).toBe(false); // Out of tolerance

    // Test case: target 500, actual 493, tolerance 1.5% (WATER)
    const target3 = 500;
    const actual3 = 493;
    const tolerancePct3 = 1.5;
    const deviation3 = Math.abs(actual3 - target3);
    const allowed3 = (tolerancePct3 / 100) * Math.abs(target3);
    expect(deviation3).toBe(7);
    expect(allowed3).toBe(7.5);
    expect(deviation3 <= allowed3).toBe(true); // Within tolerance
  });
});
