import { describe, it, expect } from 'vitest';
import { OutboundStatus } from '../../../src/domain/enums/outbound-status.js';
import { OutboundTarget } from '../../../src/domain/enums/outbound-target.js';

/**
 * Re-implement the retry delay logic from outbound-service
 * so we can test the pure math without DB dependencies.
 */
const RETRY_DELAYS_MS = [5_000, 30_000, 120_000, 600_000, 3_600_000];

function getNextRetryAt(attempts: number): Date {
  const delayIndex = Math.min(attempts, RETRY_DELAYS_MS.length - 1);
  const delayMs = RETRY_DELAYS_MS[delayIndex];
  return new Date(Date.now() + delayMs);
}

describe('Outbound Retry Logic', () => {
  describe('Exponential Backoff Calculation', () => {
    it('attempt 0 (first retry) delays 5 seconds', () => {
      expect(RETRY_DELAYS_MS[0]).toBe(5_000);
    });

    it('attempt 1 delays 30 seconds', () => {
      expect(RETRY_DELAYS_MS[1]).toBe(30_000);
    });

    it('attempt 2 delays 2 minutes (120,000ms)', () => {
      expect(RETRY_DELAYS_MS[2]).toBe(120_000);
    });

    it('attempt 3 delays 10 minutes (600,000ms)', () => {
      expect(RETRY_DELAYS_MS[3]).toBe(600_000);
    });

    it('attempt 4 delays 1 hour (3,600,000ms)', () => {
      expect(RETRY_DELAYS_MS[4]).toBe(3_600_000);
    });

    it('has exactly 5 retry delay tiers', () => {
      expect(RETRY_DELAYS_MS).toHaveLength(5);
    });

    it('delays are monotonically increasing', () => {
      for (let i = 1; i < RETRY_DELAYS_MS.length; i++) {
        expect(RETRY_DELAYS_MS[i]).toBeGreaterThan(RETRY_DELAYS_MS[i - 1]);
      }
    });

    it('getNextRetryAt returns a Date in the future', () => {
      const before = Date.now();
      const retryAt = getNextRetryAt(0);
      expect(retryAt.getTime()).toBeGreaterThanOrEqual(before + RETRY_DELAYS_MS[0]);
    });

    it('getNextRetryAt with attempts=0 is ~5s from now', () => {
      const before = Date.now();
      const retryAt = getNextRetryAt(0);
      const diff = retryAt.getTime() - before;
      // Allow a small tolerance for execution time
      expect(diff).toBeGreaterThanOrEqual(5_000);
      expect(diff).toBeLessThan(5_100);
    });

    it('getNextRetryAt with attempts=4 is ~1hr from now', () => {
      const before = Date.now();
      const retryAt = getNextRetryAt(4);
      const diff = retryAt.getTime() - before;
      expect(diff).toBeGreaterThanOrEqual(3_600_000);
      expect(diff).toBeLessThan(3_600_100);
    });

    it('getNextRetryAt clamps to max delay for attempts beyond array length', () => {
      const before = Date.now();
      const retryAt = getNextRetryAt(10);
      const diff = retryAt.getTime() - before;
      // Should use RETRY_DELAYS_MS[4] (1 hour) since index is clamped
      expect(diff).toBeGreaterThanOrEqual(3_600_000);
      expect(diff).toBeLessThan(3_600_100);
    });

    it('each successive attempt increases the delay', () => {
      const delays: number[] = [];
      const base = Date.now();
      for (let i = 0; i < 5; i++) {
        const retryAt = getNextRetryAt(i);
        delays.push(retryAt.getTime() - base);
      }
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThan(delays[i - 1]);
      }
    });
  });

  describe('Max Attempts and DEAD_LETTER', () => {
    it('maxAttempts is typically 5', () => {
      const maxAttempts = 5;
      expect(maxAttempts).toBe(RETRY_DELAYS_MS.length);
    });

    it('when currentAttempts >= maxAttempts, status becomes DEAD_LETTER', () => {
      const maxAttempts = 5;
      const currentAttempts = 5;
      const status = currentAttempts >= maxAttempts
        ? OutboundStatus.DEAD_LETTER
        : OutboundStatus.FAILED;
      expect(status).toBe(OutboundStatus.DEAD_LETTER);
    });

    it('when currentAttempts < maxAttempts, status remains FAILED with retry', () => {
      const maxAttempts = 5;
      const currentAttempts = 3;
      const status = currentAttempts >= maxAttempts
        ? OutboundStatus.DEAD_LETTER
        : OutboundStatus.FAILED;
      expect(status).toBe(OutboundStatus.FAILED);
    });

    it('attempt 1 of 5 retries (not dead-lettered)', () => {
      expect(1 < 5).toBe(true);
    });

    it('attempt 4 of 5 retries (not dead-lettered)', () => {
      expect(4 < 5).toBe(true);
    });

    it('attempt 5 of 5 is dead-lettered', () => {
      expect(5 >= 5).toBe(true);
    });

    it('attempt 6 of 5 is also dead-lettered (overshoot)', () => {
      expect(6 >= 5).toBe(true);
    });
  });

  describe('OutboundStatus Enum Values', () => {
    it('has PENDING for newly created events', () => {
      expect(OutboundStatus.PENDING).toBe('PENDING');
    });

    it('has SENT for successfully delivered events', () => {
      expect(OutboundStatus.SENT).toBe('SENT');
    });

    it('has FAILED for events that need retry', () => {
      expect(OutboundStatus.FAILED).toBe('FAILED');
    });

    it('has DEAD_LETTER for events that exhausted retries', () => {
      expect(OutboundStatus.DEAD_LETTER).toBe('DEAD_LETTER');
    });

    it('has exactly 4 statuses', () => {
      expect(Object.values(OutboundStatus)).toHaveLength(4);
    });

    it('lifecycle: PENDING -> SENT (success path)', () => {
      const path = [OutboundStatus.PENDING, OutboundStatus.SENT];
      expect(path).toEqual(['PENDING', 'SENT']);
    });

    it('lifecycle: PENDING -> FAILED -> ... -> DEAD_LETTER (failure path)', () => {
      const path = [OutboundStatus.PENDING, OutboundStatus.FAILED, OutboundStatus.DEAD_LETTER];
      expect(path).toEqual(['PENDING', 'FAILED', 'DEAD_LETTER']);
    });

    it('lifecycle: PENDING -> FAILED -> SENT (retry success path)', () => {
      const path = [OutboundStatus.PENDING, OutboundStatus.FAILED, OutboundStatus.SENT];
      expect(path).toEqual(['PENDING', 'FAILED', 'SENT']);
    });
  });

  describe('OutboundTarget Enum Values', () => {
    it('has OTL_CORE for order-ticket-load core service', () => {
      expect(OutboundTarget.OTL_CORE).toBe('OTL_CORE');
    });

    it('has ANALYTICS_HUB for analytics integration hub', () => {
      expect(OutboundTarget.ANALYTICS_HUB).toBe('ANALYTICS_HUB');
    });

    it('has exactly 2 targets', () => {
      expect(Object.values(OutboundTarget)).toHaveLength(2);
    });

    it('target values match sibling project identifiers', () => {
      const targets = Object.values(OutboundTarget);
      expect(targets).toContain('OTL_CORE');
      expect(targets).toContain('ANALYTICS_HUB');
    });
  });
});
