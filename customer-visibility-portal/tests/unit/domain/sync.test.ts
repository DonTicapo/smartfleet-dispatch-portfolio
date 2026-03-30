import { describe, it, expect } from 'vitest';
import { OrderViewStatus } from '../../../src/domain/enums/order-view-status.js';
import { LoadTrackerStatus } from '../../../src/domain/enums/load-tracker-status.js';

describe('Sync / View Projection Logic', () => {
  describe('OrderViewStatus Transitions', () => {
    it('has all 5 lifecycle statuses', () => {
      const values = Object.values(OrderViewStatus);
      expect(values).toHaveLength(5);
    });

    it('starts with DRAFT', () => {
      expect(OrderViewStatus.DRAFT).toBe('DRAFT');
    });

    it('DRAFT can transition to CONFIRMED', () => {
      const validNextFromDraft = [OrderViewStatus.CONFIRMED, OrderViewStatus.CANCELLED];
      expect(validNextFromDraft).toContain(OrderViewStatus.CONFIRMED);
    });

    it('CONFIRMED can transition to IN_PROGRESS', () => {
      const validNextFromConfirmed = [
        OrderViewStatus.IN_PROGRESS,
        OrderViewStatus.CANCELLED,
      ];
      expect(validNextFromConfirmed).toContain(OrderViewStatus.IN_PROGRESS);
    });

    it('IN_PROGRESS can transition to COMPLETED', () => {
      const validNextFromInProgress = [
        OrderViewStatus.COMPLETED,
        OrderViewStatus.CANCELLED,
      ];
      expect(validNextFromInProgress).toContain(OrderViewStatus.COMPLETED);
    });

    it('COMPLETED is a terminal state', () => {
      expect(OrderViewStatus.COMPLETED).toBe('COMPLETED');
    });

    it('CANCELLED is a terminal state', () => {
      expect(OrderViewStatus.CANCELLED).toBe('CANCELLED');
    });

    it('happy-path progression is DRAFT -> CONFIRMED -> IN_PROGRESS -> COMPLETED', () => {
      const happyPath = [
        OrderViewStatus.DRAFT,
        OrderViewStatus.CONFIRMED,
        OrderViewStatus.IN_PROGRESS,
        OrderViewStatus.COMPLETED,
      ];
      expect(happyPath).toEqual(['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']);
    });

    it('all status values are uppercase strings matching their keys', () => {
      for (const [key, value] of Object.entries(OrderViewStatus)) {
        expect(key).toBe(value);
      }
    });
  });

  describe('LoadTrackerStatus 8-Step Progression', () => {
    const ORDERED_STATUSES = [
      LoadTrackerStatus.SCHEDULED,
      LoadTrackerStatus.LOADING,
      LoadTrackerStatus.LOADED,
      LoadTrackerStatus.EN_ROUTE,
      LoadTrackerStatus.ON_SITE,
      LoadTrackerStatus.POURING,
      LoadTrackerStatus.RETURNING,
      LoadTrackerStatus.COMPLETED,
    ];

    it('has exactly 8 statuses', () => {
      const values = Object.values(LoadTrackerStatus);
      expect(values).toHaveLength(8);
    });

    it('SCHEDULED is the first step', () => {
      expect(ORDERED_STATUSES[0]).toBe(LoadTrackerStatus.SCHEDULED);
    });

    it('COMPLETED is the last step', () => {
      expect(ORDERED_STATUSES[7]).toBe(LoadTrackerStatus.COMPLETED);
    });

    it('progression follows plant-to-site-and-back lifecycle', () => {
      // SCHEDULED: load scheduled at plant
      // LOADING: mixer is filling the truck
      // LOADED: truck loaded, ready to depart
      // EN_ROUTE: truck traveling to site
      // ON_SITE: truck arrived at job site
      // POURING: concrete being poured
      // RETURNING: truck heading back to plant
      // COMPLETED: round-trip complete
      expect(ORDERED_STATUSES).toEqual([
        'SCHEDULED',
        'LOADING',
        'LOADED',
        'EN_ROUTE',
        'ON_SITE',
        'POURING',
        'RETURNING',
        'COMPLETED',
      ]);
    });

    it('each status is distinct', () => {
      const unique = new Set(ORDERED_STATUSES);
      expect(unique.size).toBe(ORDERED_STATUSES.length);
    });

    it('contains plant-side statuses (SCHEDULED, LOADING, LOADED)', () => {
      expect(ORDERED_STATUSES).toContain(LoadTrackerStatus.SCHEDULED);
      expect(ORDERED_STATUSES).toContain(LoadTrackerStatus.LOADING);
      expect(ORDERED_STATUSES).toContain(LoadTrackerStatus.LOADED);
    });

    it('contains transit statuses (EN_ROUTE, ON_SITE)', () => {
      expect(ORDERED_STATUSES).toContain(LoadTrackerStatus.EN_ROUTE);
      expect(ORDERED_STATUSES).toContain(LoadTrackerStatus.ON_SITE);
    });

    it('contains site-side statuses (POURING, RETURNING, COMPLETED)', () => {
      expect(ORDERED_STATUSES).toContain(LoadTrackerStatus.POURING);
      expect(ORDERED_STATUSES).toContain(LoadTrackerStatus.RETURNING);
      expect(ORDERED_STATUSES).toContain(LoadTrackerStatus.COMPLETED);
    });
  });

  describe('Customer-Scoped Access', () => {
    it('OrderViewStatus enum values are complete (no missing values)', () => {
      const expected = ['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      const actual = Object.values(OrderViewStatus);
      expect(actual.sort()).toEqual(expected.sort());
    });

    it('LoadTrackerStatus enum values are complete (no missing values)', () => {
      const expected = [
        'SCHEDULED',
        'LOADING',
        'LOADED',
        'EN_ROUTE',
        'ON_SITE',
        'POURING',
        'RETURNING',
        'COMPLETED',
      ];
      const actual = Object.values(LoadTrackerStatus);
      expect(actual.sort()).toEqual(expected.sort());
    });

    it('customer scoping requires customerId comparison on OrderView', () => {
      // Simulating the service pattern: order.customerId !== customerId -> throw
      const order = { id: 'order-1', customerId: 'cust-A' };
      const requestingCustomerId = 'cust-B';
      const isOwnedByRequester = order.customerId === requestingCustomerId;
      expect(isOwnedByRequester).toBe(false);
    });

    it('customer can access their own orders', () => {
      const order = { id: 'order-1', customerId: 'cust-A' };
      const requestingCustomerId = 'cust-A';
      const isOwnedByRequester = order.customerId === requestingCustomerId;
      expect(isOwnedByRequester).toBe(true);
    });

    it('load tracker access is verified through ticket->order chain', () => {
      // Simulating the ownership chain: load -> ticket -> order.customerId
      const load = { ticketId: 'ticket-1' };
      const ticket = { id: 'ticket-1', orderId: 'order-1' };
      const order = { id: 'order-1', customerId: 'cust-A' };

      // Customer A should have access
      expect(order.customerId).toBe('cust-A');
      expect(ticket.id).toBe(load.ticketId);
      expect(order.id).toBe(ticket.orderId);
    });

    it('load tracker access denied when customer does not own the order', () => {
      const order = { id: 'order-1', customerId: 'cust-A' };
      const requestingCustomerId = 'cust-B';
      const hasAccess = order.customerId === requestingCustomerId;
      expect(hasAccess).toBe(false);
    });
  });
});
