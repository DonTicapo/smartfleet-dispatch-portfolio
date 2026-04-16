import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Knex } from 'knex';
import { randomUUID } from 'crypto';
import {
  setupTestDb,
  teardownTestDb,
  makePortalUser,
  makeOrderView,
  makeTicketView,
  makeLoadTracker,
  makePortalMessage,
  hashPassword,
} from '../helpers/test-utils.js';

let db: Knex;
const customerId = randomUUID();

describe('Customer Visibility Portal — Full Vertical Slice', () => {
  beforeAll(async () => {
    db = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it('creates portal user -> order view -> ticket view -> load tracker -> messages -> query chain', async () => {
    // 1. Create portal user
    const [user] = await db('portal_users')
      .insert(makePortalUser(customerId, { email: 'alice@acme.com', password_hash: hashPassword('secret123!') }))
      .returning('*');
    expect(user.id).toBeDefined();
    expect(user.email).toBe('alice@acme.com');
    expect(user.role).toBe('VIEWER');
    expect(user.is_active).toBe(true);

    // 2. Create order view (simulating sync from OTL Core)
    const [orderView] = await db('order_views')
      .insert(
        makeOrderView(customerId, {
          external_order_id: 'otl-order-001',
          job_name: 'Highway Bridge Pour',
          site_name: 'Bridge Construction Site A',
          mix_design_name: 'High-Strength 4000 PSI',
          requested_quantity_amount: 120.0,
          requested_quantity_unit: 'M3',
          status: 'CONFIRMED',
        }),
      )
      .returning('*');
    expect(orderView.id).toBeDefined();
    expect(orderView.status).toBe('CONFIRMED');

    // 3. Create ticket view
    const [ticketView] = await db('ticket_views')
      .insert(
        makeTicketView(orderView.id, {
          external_ticket_id: 'otl-ticket-001',
          ticket_number: 'TKT-BRIDGE-001',
          status: 'SCHEDULED',
          scheduled_date: '2026-04-01',
          plant_id: 'PLANT-A',
        }),
      )
      .returning('*');
    expect(ticketView.id).toBeDefined();
    expect(ticketView.ticket_number).toBe('TKT-BRIDGE-001');

    // 4. Create load tracker
    const [loadTracker] = await db('load_trackers')
      .insert(
        makeLoadTracker(ticketView.id, {
          external_load_id: 'otl-load-001',
          load_number: 1,
          truck_id: 'TRUCK-42',
          driver_id: 'DRIVER-7',
          status: 'EN_ROUTE',
        }),
      )
      .returning('*');
    expect(loadTracker.id).toBeDefined();
    expect(loadTracker.status).toBe('EN_ROUTE');

    // 5. Update load position
    await db('load_trackers').where({ id: loadTracker.id }).update({
      current_lat: 32.7767,
      current_lon: -96.797,
      eta_minutes: 15,
      last_position_at: new Date(),
      updated_at: new Date(),
    });

    // 6. Verify position update
    const updatedLoad = await db('load_trackers').where({ id: loadTracker.id }).first();
    expect(parseFloat(updatedLoad.current_lat)).toBeCloseTo(32.7767, 3);
    expect(parseFloat(updatedLoad.current_lon)).toBeCloseTo(-96.797, 3);
    expect(updatedLoad.eta_minutes).toBe(15);

    // 7. Create portal messages
    const [msg1] = await db('portal_messages')
      .insert(
        makePortalMessage(customerId, {
          subject: 'Order Confirmed',
          body: 'Your order for Highway Bridge Pour has been confirmed.',
          severity: 'INFO',
        }),
      )
      .returning('*');
    expect(msg1.is_read).toBe(false);

    const [msg2] = await db('portal_messages')
      .insert(
        makePortalMessage(customerId, {
          order_id: orderView.id,
          subject: 'Delivery Delay',
          body: 'Load 1 is delayed by 15 minutes due to traffic.',
          severity: 'WARNING',
        }),
      )
      .returning('*');
    expect(msg2.severity).toBe('WARNING');

    // 8. Mark message as read
    await db('portal_messages').where({ id: msg1.id }).update({ is_read: true });
    const readMsg = await db('portal_messages').where({ id: msg1.id }).first();
    expect(readMsg.is_read).toBe(true);

    // 9. Query order views by customer
    const orders = await db('order_views').where({ customer_id: customerId });
    expect(orders).toHaveLength(1);
    expect(orders[0].job_name).toBe('Highway Bridge Pour');

    // 10. Query tickets by order
    const tickets = await db('ticket_views').where({ order_id: orderView.id });
    expect(tickets).toHaveLength(1);

    // 11. Query loads by ticket
    const loads = await db('load_trackers').where({ ticket_id: ticketView.id });
    expect(loads).toHaveLength(1);
    expect(loads[0].status).toBe('EN_ROUTE');

    // 12. Query unread messages
    const unreadMessages = await db('portal_messages')
      .where({ customer_id: customerId, is_read: false });
    expect(unreadMessages).toHaveLength(1);
    expect(unreadMessages[0].subject).toBe('Delivery Delay');

    // 13. Create second load and verify ordering
    const [load2] = await db('load_trackers')
      .insert(
        makeLoadTracker(ticketView.id, {
          external_load_id: 'otl-load-002',
          load_number: 2,
          truck_id: 'TRUCK-43',
          status: 'SCHEDULED',
        }),
      )
      .returning('*');
    expect(load2.load_number).toBe(2);

    const allLoads = await db('load_trackers')
      .where({ ticket_id: ticketView.id })
      .orderBy('load_number');
    expect(allLoads).toHaveLength(2);
    expect(allLoads[0].load_number).toBe(1);
    expect(allLoads[1].load_number).toBe(2);

    // 14. Write audit log entry
    await db('audit_log').insert({
      entity_type: 'OrderView',
      entity_id: orderView.id,
      action: 'SYNC',
      actor: 'cvp-service',
      changes: JSON.stringify({ source: 'otl-core' }),
    });

    const auditEntries = await db('audit_log')
      .where({ entity_type: 'OrderView', entity_id: orderView.id });
    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0].action).toBe('SYNC');

    // 15. Verify customer scoping — different customer should see nothing
    const otherCustomerId = randomUUID();
    const otherOrders = await db('order_views').where({ customer_id: otherCustomerId });
    expect(otherOrders).toHaveLength(0);
  });

  it('enforces unique constraints on external IDs', async () => {
    const [order] = await db('order_views')
      .insert(makeOrderView(customerId, { external_order_id: 'unique-order-test' }))
      .returning('*');
    expect(order.id).toBeDefined();

    // Duplicate external_order_id should fail
    await expect(
      db('order_views').insert(makeOrderView(customerId, { external_order_id: 'unique-order-test' })),
    ).rejects.toThrow();
  });

  it('enforces unique email on portal users', async () => {
    await db('portal_users')
      .insert(makePortalUser(customerId, { email: 'unique@test.com' }))
      .returning('*');

    await expect(
      db('portal_users').insert(makePortalUser(customerId, { email: 'unique@test.com' })),
    ).rejects.toThrow();
  });
});
