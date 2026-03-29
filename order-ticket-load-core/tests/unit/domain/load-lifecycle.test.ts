import { describe, it, expect } from 'vitest';
import { LoadStatus } from '../../../src/domain/enums/load-status.js';
import { DeliveryState } from '../../../src/domain/enums/delivery-state.js';
import {
  canTransition,
  transitionLoad,
  getLoadStatusForDeliveryState,
  isTerminalStatus,
} from '../../../src/domain/state-machines/load-lifecycle.js';
import { InvalidTransitionError } from '../../../src/domain/errors/domain-error.js';
import type { Load } from '../../../src/domain/entities/load.js';

function makeLoad(status: LoadStatus): Load {
  return {
    id: 'test-load-id',
    ticketId: 'test-ticket-id',
    loadNumber: 1,
    truckId: null,
    driverId: null,
    mixDesignId: 'test-mix-id',
    actualQuantity: null,
    status,
    batchedAt: null,
    departedPlantAt: null,
    arrivedSiteAt: null,
    pourStartedAt: null,
    pourCompletedAt: null,
    returnedPlantAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('Load Lifecycle State Machine', () => {
  describe('canTransition', () => {
    const validTransitions: [LoadStatus, LoadStatus][] = [
      [LoadStatus.SCHEDULED, LoadStatus.LOADING],
      [LoadStatus.SCHEDULED, LoadStatus.CANCELLED],
      [LoadStatus.LOADING, LoadStatus.LOADED],
      [LoadStatus.LOADING, LoadStatus.CANCELLED],
      [LoadStatus.LOADED, LoadStatus.EN_ROUTE],
      [LoadStatus.LOADED, LoadStatus.CANCELLED],
      [LoadStatus.EN_ROUTE, LoadStatus.ON_SITE],
      [LoadStatus.EN_ROUTE, LoadStatus.CANCELLED],
      [LoadStatus.ON_SITE, LoadStatus.POURING],
      [LoadStatus.ON_SITE, LoadStatus.REJECTED],
      [LoadStatus.ON_SITE, LoadStatus.CANCELLED],
      [LoadStatus.POURING, LoadStatus.RETURNING],
      [LoadStatus.POURING, LoadStatus.CANCELLED],
      [LoadStatus.RETURNING, LoadStatus.COMPLETED],
    ];

    it.each(validTransitions)('allows %s -> %s', (from, to) => {
      expect(canTransition(from, to)).toBe(true);
    });

    const invalidTransitions: [LoadStatus, LoadStatus][] = [
      [LoadStatus.SCHEDULED, LoadStatus.EN_ROUTE],
      [LoadStatus.SCHEDULED, LoadStatus.COMPLETED],
      [LoadStatus.EN_ROUTE, LoadStatus.LOADING],
      [LoadStatus.COMPLETED, LoadStatus.SCHEDULED],
      [LoadStatus.CANCELLED, LoadStatus.SCHEDULED],
      [LoadStatus.REJECTED, LoadStatus.POURING],
      [LoadStatus.RETURNING, LoadStatus.CANCELLED],
    ];

    it.each(invalidTransitions)('rejects %s -> %s', (from, to) => {
      expect(canTransition(from, to)).toBe(false);
    });
  });

  describe('transitionLoad', () => {
    it('returns updated load on valid transition', () => {
      const load = makeLoad(LoadStatus.SCHEDULED);
      const result = transitionLoad(load, LoadStatus.LOADING);
      expect(result.status).toBe(LoadStatus.LOADING);
      expect(result.id).toBe(load.id);
    });

    it('throws InvalidTransitionError on invalid transition', () => {
      const load = makeLoad(LoadStatus.COMPLETED);
      expect(() => transitionLoad(load, LoadStatus.SCHEDULED)).toThrow(InvalidTransitionError);
    });

    it('does not mutate the original load', () => {
      const load = makeLoad(LoadStatus.SCHEDULED);
      const result = transitionLoad(load, LoadStatus.LOADING);
      expect(load.status).toBe(LoadStatus.SCHEDULED);
      expect(result.status).toBe(LoadStatus.LOADING);
    });
  });

  describe('getLoadStatusForDeliveryState', () => {
    it('maps PLANT_DEPARTED to EN_ROUTE', () => {
      expect(getLoadStatusForDeliveryState(DeliveryState.PLANT_DEPARTED)).toBe(LoadStatus.EN_ROUTE);
    });

    it('maps ON_SITE_ARRIVED to ON_SITE', () => {
      expect(getLoadStatusForDeliveryState(DeliveryState.ON_SITE_ARRIVED)).toBe(LoadStatus.ON_SITE);
    });

    it('maps POUR_STARTED to POURING', () => {
      expect(getLoadStatusForDeliveryState(DeliveryState.POUR_STARTED)).toBe(LoadStatus.POURING);
    });

    it('maps POUR_COMPLETED to RETURNING', () => {
      expect(getLoadStatusForDeliveryState(DeliveryState.POUR_COMPLETED)).toBe(
        LoadStatus.RETURNING,
      );
    });

    it('maps PLANT_RETURNED to COMPLETED', () => {
      expect(getLoadStatusForDeliveryState(DeliveryState.PLANT_RETURNED)).toBe(
        LoadStatus.COMPLETED,
      );
    });

    it('returns null for informational events', () => {
      expect(getLoadStatusForDeliveryState(DeliveryState.GEOFENCE_ENTERED)).toBeNull();
      expect(getLoadStatusForDeliveryState(DeliveryState.SITE_DEPARTED)).toBeNull();
      expect(getLoadStatusForDeliveryState(DeliveryState.WASHOUT_COMPLETED)).toBeNull();
    });
  });

  describe('isTerminalStatus', () => {
    it('identifies terminal states', () => {
      expect(isTerminalStatus(LoadStatus.COMPLETED)).toBe(true);
      expect(isTerminalStatus(LoadStatus.CANCELLED)).toBe(true);
      expect(isTerminalStatus(LoadStatus.REJECTED)).toBe(true);
    });

    it('identifies non-terminal states', () => {
      expect(isTerminalStatus(LoadStatus.SCHEDULED)).toBe(false);
      expect(isTerminalStatus(LoadStatus.EN_ROUTE)).toBe(false);
      expect(isTerminalStatus(LoadStatus.POURING)).toBe(false);
    });
  });
});
