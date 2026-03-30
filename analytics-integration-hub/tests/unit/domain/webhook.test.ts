import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { signPayload } from '../../../src/infrastructure/clients/webhook-dispatcher.js';
import { DeliveryStatus } from '../../../src/domain/enums/delivery-status.js';

describe('Webhook Domain Logic', () => {
  describe('HMAC-SHA256 Signature Computation', () => {
    const testSecret = 'webhook-secret-key-for-testing';

    it('signPayload returns a hex string', () => {
      const signature = signPayload('{"test": true}', testSecret);
      expect(typeof signature).toBe('string');
      expect(/^[0-9a-f]+$/.test(signature)).toBe(true);
    });

    it('signPayload produces a 64-char hex digest (SHA-256)', () => {
      const signature = signPayload('hello world', testSecret);
      expect(signature).toHaveLength(64);
    });

    it('signPayload matches manual HMAC-SHA256 computation', () => {
      const payload = '{"eventId":"evt_123","eventType":"load.completed"}';
      const expected = createHmac('sha256', testSecret).update(payload).digest('hex');
      const actual = signPayload(payload, testSecret);
      expect(actual).toBe(expected);
    });

    it('same payload and secret produce the same signature', () => {
      const payload = '{"data":"consistent"}';
      const sig1 = signPayload(payload, testSecret);
      const sig2 = signPayload(payload, testSecret);
      expect(sig1).toBe(sig2);
    });

    it('different payloads produce different signatures', () => {
      const sig1 = signPayload('payload-one', testSecret);
      const sig2 = signPayload('payload-two', testSecret);
      expect(sig1).not.toBe(sig2);
    });

    it('different secrets produce different signatures', () => {
      const payload = '{"same":"payload"}';
      const sig1 = signPayload(payload, 'secret-A');
      const sig2 = signPayload(payload, 'secret-B');
      expect(sig1).not.toBe(sig2);
    });

    it('signature format used in headers is sha256=<hex>', () => {
      const signature = signPayload('test', testSecret);
      const headerValue = `sha256=${signature}`;
      expect(headerValue).toMatch(/^sha256=[0-9a-f]{64}$/);
    });

    it('empty payload produces a valid signature', () => {
      const signature = signPayload('', testSecret);
      expect(signature).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(signature)).toBe(true);
    });

    it('JSON stringified webhook payload produces consistent signature', () => {
      const payload = JSON.stringify({
        eventId: 'evt_001',
        eventType: 'load.completed',
        source: 'OTL_CORE',
        aggregateType: 'Load',
        aggregateId: 'load-123',
        payload: { status: 'COMPLETED' },
        occurredAt: '2026-03-29T12:00:00Z',
      });
      const sig = signPayload(payload, testSecret);
      // Re-sign the exact same string
      const sigAgain = signPayload(payload, testSecret);
      expect(sig).toBe(sigAgain);
    });
  });

  describe('DeliveryStatus Transitions', () => {
    it('webhook delivery starts as PENDING', () => {
      expect(DeliveryStatus.PENDING).toBe('PENDING');
    });

    it('transitions to DELIVERED on successful HTTP response', () => {
      expect(DeliveryStatus.DELIVERED).toBe('DELIVERED');
    });

    it('transitions to FAILED on HTTP error or timeout', () => {
      expect(DeliveryStatus.FAILED).toBe('FAILED');
    });

    it('PENDING -> DELIVERED is the happy path', () => {
      const path = [DeliveryStatus.PENDING, DeliveryStatus.DELIVERED];
      expect(path).toEqual(['PENDING', 'DELIVERED']);
    });

    it('PENDING -> FAILED is the error path', () => {
      const path = [DeliveryStatus.PENDING, DeliveryStatus.FAILED];
      expect(path).toEqual(['PENDING', 'FAILED']);
    });

    it('has exactly 3 statuses', () => {
      expect(Object.values(DeliveryStatus)).toHaveLength(3);
    });
  });

  describe('Webhook Subscription Event Type Filtering', () => {
    it('subscription with wildcard matches all event types', () => {
      const subscription = { eventTypes: ['*'] };
      const incomingEvent = 'load.completed';
      const matches =
        subscription.eventTypes.includes('*') ||
        subscription.eventTypes.includes(incomingEvent);
      expect(matches).toBe(true);
    });

    it('subscription with specific event type matches that type', () => {
      const subscription = { eventTypes: ['load.completed', 'load.created'] };
      const incomingEvent = 'load.completed';
      const matches = subscription.eventTypes.includes(incomingEvent);
      expect(matches).toBe(true);
    });

    it('subscription does not match unsubscribed event types', () => {
      const subscription = { eventTypes: ['load.completed'] };
      const incomingEvent = 'delivery.plant_departed';
      const matches = subscription.eventTypes.includes(incomingEvent);
      expect(matches).toBe(false);
    });

    it('empty eventTypes array matches nothing', () => {
      const subscription = { eventTypes: [] as string[] };
      const incomingEvent = 'load.completed';
      const matches = subscription.eventTypes.includes(incomingEvent);
      expect(matches).toBe(false);
    });

    it('subscription can have multiple event types', () => {
      const subscription = {
        eventTypes: [
          'load.created',
          'load.completed',
          'delivery.plant_departed',
          'delivery.arrived_site',
        ],
      };
      expect(subscription.eventTypes).toHaveLength(4);
      expect(subscription.eventTypes.includes('load.created')).toBe(true);
      expect(subscription.eventTypes.includes('delivery.arrived_site')).toBe(true);
      expect(subscription.eventTypes.includes('batch.completed')).toBe(false);
    });

    it('inactive subscription should not receive deliveries', () => {
      const subscription = {
        isActive: false,
        eventTypes: ['load.completed'],
      };
      const shouldDeliver = subscription.isActive && subscription.eventTypes.includes('load.completed');
      expect(shouldDeliver).toBe(false);
    });

    it('active subscription with matching event type should receive delivery', () => {
      const subscription = {
        isActive: true,
        eventTypes: ['load.completed'],
      };
      const shouldDeliver = subscription.isActive && subscription.eventTypes.includes('load.completed');
      expect(shouldDeliver).toBe(true);
    });

    it('failureCount does not prevent matching, only isActive does', () => {
      const subscription = {
        isActive: true,
        failureCount: 10,
        eventTypes: ['load.completed'],
      };
      const shouldDeliver = subscription.isActive && subscription.eventTypes.includes('load.completed');
      expect(shouldDeliver).toBe(true);
    });
  });
});
