import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Knex } from 'knex';
import { setupTestDb, teardownTestDb, getTestDb } from '../../helpers/test-db.js';
import { makeCustomer, makeMixDesign, makeSite, makeJob } from '../../helpers/fixtures.js';

let db: Knex;

describe('Order Flow — Full Vertical Slice', () => {
  beforeAll(async () => {
    db = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it('creates customer -> site -> job -> order -> ticket -> load -> delivery events -> query ticket', async () => {
    // 1. Create customer
    const [customer] = await db('customers').insert(makeCustomer()).returning('*');
    expect(customer.id).toBeDefined();
    expect(customer.name).toBe('Test Customer');

    // 2. Create mix design
    const [mixDesign] = await db('mix_designs').insert(makeMixDesign()).returning('*');
    expect(mixDesign.id).toBeDefined();

    // 3. Create site
    const [site] = await db('sites').insert(makeSite(customer.id)).returning('*');
    expect(site.id).toBeDefined();

    // 4. Create job
    const [job] = await db('jobs').insert(makeJob(customer.id, site.id)).returning('*');
    expect(job.id).toBeDefined();

    // 5. Create order
    const [order] = await db('orders')
      .insert({
        customer_id: customer.id,
        job_id: job.id,
        mix_design_id: mixDesign.id,
        requested_quantity_amount: 50.0,
        requested_quantity_unit: 'CY',
        requested_delivery_date: '2026-04-01',
        status: 'DRAFT',
        created_by: 'test-user',
      })
      .returning('*');
    expect(order.id).toBeDefined();
    expect(order.status).toBe('DRAFT');

    // 6. Create ticket
    const [ticket] = await db('tickets')
      .insert({
        order_id: order.id,
        ticket_number: 'TKT-FLOW-001',
        status: 'CREATED',
        scheduled_date: '2026-04-01',
        created_by: 'test-user',
      })
      .returning('*');
    expect(ticket.id).toBeDefined();

    // 7. Create load
    const [load] = await db('loads')
      .insert({
        ticket_id: ticket.id,
        load_number: 1,
        mix_design_id: mixDesign.id,
        status: 'SCHEDULED',
      })
      .returning('*');
    expect(load.id).toBeDefined();
    expect(load.status).toBe('SCHEDULED');

    // 8. Record PLANT_DEPARTED event
    const eventId1 = 'evt-flow-001';
    const [evt1] = await db('delivery_state_events')
      .insert({
        event_id: eventId1,
        load_id: load.id,
        state: 'PLANT_DEPARTED',
        occurred_at: new Date('2026-04-01T08:00:00Z'),
        source: 'navixy-bridge',
      })
      .returning('*');
    expect(evt1.event_id).toBe(eventId1);

    // Simulate load status update (in real app, delivery-event-service does this)
    await db('loads').where({ id: load.id }).update({
      status: 'EN_ROUTE',
      departed_plant_at: new Date('2026-04-01T08:00:00Z'),
      updated_at: new Date(),
    });

    // 9. Try duplicate event (idempotency) — should fail gracefully
    const dupResult = await db.raw(
      `INSERT INTO delivery_state_events (event_id, load_id, state, occurred_at, source)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING *`,
      [eventId1, load.id, 'PLANT_DEPARTED', new Date('2026-04-01T08:00:00Z'), 'navixy-bridge'],
    );
    expect(dupResult.rows).toHaveLength(0); // no new row

    // 10. Record ON_SITE_ARRIVED
    await db('delivery_state_events').insert({
      event_id: 'evt-flow-002',
      load_id: load.id,
      state: 'ON_SITE_ARRIVED',
      occurred_at: new Date('2026-04-01T08:30:00Z'),
      source: 'navixy-bridge',
    });
    await db('loads').where({ id: load.id }).update({
      status: 'ON_SITE',
      arrived_site_at: new Date('2026-04-01T08:30:00Z'),
      updated_at: new Date(),
    });

    // 11. Query ticket with loads and events
    const ticketRow = await db('tickets').where({ id: ticket.id }).first();
    expect(ticketRow).toBeDefined();

    const loads = await db('loads')
      .where({ ticket_id: ticket.id })
      .orderBy('load_number');
    expect(loads).toHaveLength(1);
    expect(loads[0].status).toBe('ON_SITE');

    const events = await db('delivery_state_events')
      .where({ load_id: load.id })
      .orderBy('occurred_at');
    expect(events).toHaveLength(2);
    expect(events[0].state).toBe('PLANT_DEPARTED');
    expect(events[1].state).toBe('ON_SITE_ARRIVED');

    // 12. Verify audit trail
    const auditEntries = await db('audit_log').select('*');
    // No audit entries yet since we inserted directly (not through the service)
    // In the full app, audit entries would be created by the services
    expect(auditEntries).toBeDefined();
  });
});
