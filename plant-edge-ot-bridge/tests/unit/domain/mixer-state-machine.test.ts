import { describe, it, expect } from 'vitest';
import { MixerStatus } from '../../../src/domain/enums/mixer-status.js';
import {
  canTransition,
  transitionMixer,
  isFaultStatus,
} from '../../../src/domain/state-machines/mixer-state-machine.js';
import { InvalidTransitionError } from '../../../src/domain/errors/domain-error.js';
import type { Mixer } from '../../../src/domain/entities/mixer.js';
import { MixerType } from '../../../src/domain/enums/mixer-type.js';

function makeMixer(status: MixerStatus): Mixer {
  return {
    id: 'test-mixer-id',
    plantId: 'test-plant-id',
    code: 'MXR-001',
    name: 'Test Mixer',
    type: MixerType.DRUM,
    capacityCy: 10,
    status,
    lastStatusAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('Mixer State Machine', () => {
  describe('canTransition', () => {
    const validTransitions: [MixerStatus, MixerStatus][] = [
      [MixerStatus.IDLE, MixerStatus.MIXING],
      [MixerStatus.IDLE, MixerStatus.CLEANING],
      [MixerStatus.IDLE, MixerStatus.MAINTENANCE],
      [MixerStatus.MIXING, MixerStatus.IDLE],
      [MixerStatus.MIXING, MixerStatus.FAULT],
      [MixerStatus.CLEANING, MixerStatus.IDLE],
      [MixerStatus.MAINTENANCE, MixerStatus.IDLE],
      [MixerStatus.FAULT, MixerStatus.MAINTENANCE],
      [MixerStatus.FAULT, MixerStatus.IDLE],
    ];

    it.each(validTransitions)('allows %s -> %s', (from, to) => {
      expect(canTransition(from, to)).toBe(true);
    });

    const invalidTransitions: [MixerStatus, MixerStatus][] = [
      [MixerStatus.IDLE, MixerStatus.FAULT],
      [MixerStatus.IDLE, MixerStatus.IDLE],
      [MixerStatus.MIXING, MixerStatus.CLEANING],
      [MixerStatus.MIXING, MixerStatus.MAINTENANCE],
      [MixerStatus.MIXING, MixerStatus.MIXING],
      [MixerStatus.CLEANING, MixerStatus.MIXING],
      [MixerStatus.CLEANING, MixerStatus.FAULT],
      [MixerStatus.CLEANING, MixerStatus.MAINTENANCE],
      [MixerStatus.MAINTENANCE, MixerStatus.MIXING],
      [MixerStatus.MAINTENANCE, MixerStatus.FAULT],
      [MixerStatus.MAINTENANCE, MixerStatus.CLEANING],
      [MixerStatus.FAULT, MixerStatus.MIXING],
      [MixerStatus.FAULT, MixerStatus.CLEANING],
      [MixerStatus.FAULT, MixerStatus.FAULT],
    ];

    it.each(invalidTransitions)('rejects %s -> %s', (from, to) => {
      expect(canTransition(from, to)).toBe(false);
    });
  });

  describe('transitionMixer', () => {
    it('returns updated mixer on valid transition', () => {
      const mixer = makeMixer(MixerStatus.IDLE);
      const result = transitionMixer(mixer, MixerStatus.MIXING);
      expect(result.status).toBe(MixerStatus.MIXING);
      expect(result.id).toBe(mixer.id);
    });

    it('throws InvalidTransitionError on invalid transition', () => {
      const mixer = makeMixer(MixerStatus.CLEANING);
      expect(() => transitionMixer(mixer, MixerStatus.FAULT)).toThrow(InvalidTransitionError);
    });

    it('does not mutate the original mixer', () => {
      const mixer = makeMixer(MixerStatus.IDLE);
      const result = transitionMixer(mixer, MixerStatus.MIXING);
      expect(mixer.status).toBe(MixerStatus.IDLE);
      expect(result.status).toBe(MixerStatus.MIXING);
    });

    it('updates lastStatusAt on transition', () => {
      const mixer = makeMixer(MixerStatus.IDLE);
      const before = mixer.lastStatusAt;
      const result = transitionMixer(mixer, MixerStatus.MIXING);
      expect(result.lastStatusAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('isFaultStatus', () => {
    it('returns true for FAULT', () => {
      expect(isFaultStatus(MixerStatus.FAULT)).toBe(true);
    });

    it('returns false for non-fault statuses', () => {
      expect(isFaultStatus(MixerStatus.IDLE)).toBe(false);
      expect(isFaultStatus(MixerStatus.MIXING)).toBe(false);
      expect(isFaultStatus(MixerStatus.CLEANING)).toBe(false);
      expect(isFaultStatus(MixerStatus.MAINTENANCE)).toBe(false);
    });
  });
});
