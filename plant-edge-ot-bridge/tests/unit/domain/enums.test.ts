import { describe, it, expect } from 'vitest';
import { MixerType } from '../../../src/domain/enums/mixer-type.js';
import { MixerStatus } from '../../../src/domain/enums/mixer-status.js';
import { BatchEventType } from '../../../src/domain/enums/batch-event-type.js';
import { MaterialType } from '../../../src/domain/enums/material-type.js';
import { WeightUnit } from '../../../src/domain/enums/weight-unit.js';
import { OutboundTarget } from '../../../src/domain/enums/outbound-target.js';
import { OutboundStatus } from '../../../src/domain/enums/outbound-status.js';
import { TOLERANCE_DEFAULTS, CRITICAL_MATERIALS } from '../../../src/domain/value-objects/tolerance-defaults.js';

describe('Domain Enums', () => {
  describe('MixerType', () => {
    it('has exactly 3 values', () => {
      const values = Object.values(MixerType);
      expect(values).toHaveLength(3);
      expect(values).toContain('DRUM');
      expect(values).toContain('CENTRAL');
      expect(values).toContain('CONTINUOUS');
    });
  });

  describe('MixerStatus', () => {
    it('has exactly 5 values', () => {
      const values = Object.values(MixerStatus);
      expect(values).toHaveLength(5);
      expect(values).toContain('IDLE');
      expect(values).toContain('MIXING');
      expect(values).toContain('CLEANING');
      expect(values).toContain('MAINTENANCE');
      expect(values).toContain('FAULT');
    });
  });

  describe('BatchEventType', () => {
    it('has exactly 6 values', () => {
      const values = Object.values(BatchEventType);
      expect(values).toHaveLength(6);
      expect(values).toContain('BATCH_STARTED');
      expect(values).toContain('BATCH_WEIGHING');
      expect(values).toContain('BATCH_MIXING');
      expect(values).toContain('BATCH_COMPLETE');
      expect(values).toContain('BATCH_LOADED');
      expect(values).toContain('BATCH_REJECTED');
    });
  });

  describe('MaterialType', () => {
    it('has exactly 6 values', () => {
      const values = Object.values(MaterialType);
      expect(values).toHaveLength(6);
      expect(values).toContain('CEMENT');
      expect(values).toContain('WATER');
      expect(values).toContain('SAND');
      expect(values).toContain('GRAVEL');
      expect(values).toContain('ADMIXTURE');
      expect(values).toContain('OTHER');
    });
  });

  describe('WeightUnit', () => {
    it('has exactly 2 values', () => {
      const values = Object.values(WeightUnit);
      expect(values).toHaveLength(2);
      expect(values).toContain('LB');
      expect(values).toContain('KG');
    });
  });

  describe('OutboundTarget', () => {
    it('has exactly 2 values', () => {
      const values = Object.values(OutboundTarget);
      expect(values).toHaveLength(2);
      expect(values).toContain('OTL_CORE');
      expect(values).toContain('ANALYTICS_HUB');
    });
  });

  describe('OutboundStatus', () => {
    it('has exactly 4 values', () => {
      const values = Object.values(OutboundStatus);
      expect(values).toHaveLength(4);
      expect(values).toContain('PENDING');
      expect(values).toContain('SENT');
      expect(values).toContain('FAILED');
      expect(values).toContain('DEAD_LETTER');
    });
  });

  describe('Tolerance Defaults', () => {
    it('defines default tolerances for all material types', () => {
      expect(TOLERANCE_DEFAULTS[MaterialType.CEMENT]).toBe(2.0);
      expect(TOLERANCE_DEFAULTS[MaterialType.WATER]).toBe(1.5);
      expect(TOLERANCE_DEFAULTS[MaterialType.SAND]).toBe(3.0);
      expect(TOLERANCE_DEFAULTS[MaterialType.GRAVEL]).toBe(3.0);
      expect(TOLERANCE_DEFAULTS[MaterialType.ADMIXTURE]).toBe(1.0);
      expect(TOLERANCE_DEFAULTS[MaterialType.OTHER]).toBe(5.0);
    });

    it('marks CEMENT and WATER as critical materials', () => {
      expect(CRITICAL_MATERIALS.has(MaterialType.CEMENT)).toBe(true);
      expect(CRITICAL_MATERIALS.has(MaterialType.WATER)).toBe(true);
      expect(CRITICAL_MATERIALS.has(MaterialType.SAND)).toBe(false);
      expect(CRITICAL_MATERIALS.has(MaterialType.GRAVEL)).toBe(false);
      expect(CRITICAL_MATERIALS.has(MaterialType.ADMIXTURE)).toBe(false);
      expect(CRITICAL_MATERIALS.has(MaterialType.OTHER)).toBe(false);
    });

    it('has stricter tolerances for critical materials', () => {
      // Critical materials (CEMENT, WATER) should have lower tolerance than non-critical
      const criticalMax = Math.max(TOLERANCE_DEFAULTS[MaterialType.CEMENT], TOLERANCE_DEFAULTS[MaterialType.WATER]);
      const nonCriticalMin = Math.min(
        TOLERANCE_DEFAULTS[MaterialType.SAND],
        TOLERANCE_DEFAULTS[MaterialType.GRAVEL],
        TOLERANCE_DEFAULTS[MaterialType.OTHER],
      );
      expect(criticalMax).toBeLessThan(nonCriticalMin);
    });
  });
});
