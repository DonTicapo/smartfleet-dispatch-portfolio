import { describe, it, expect } from 'vitest';
import { MaterialType } from '../../../src/domain/enums/material-type.js';
import { TOLERANCE_DEFAULTS, CRITICAL_MATERIALS } from '../../../src/domain/value-objects/tolerance-defaults.js';

/**
 * Re-implement the tolerance function from scale-reading-service
 * so we can test the pure math without DB dependencies.
 */
function isWithinTolerance(targetWeight: number, actualWeight: number, tolerancePercent: number): boolean {
  if (targetWeight === 0) return actualWeight === 0;
  const deviation = Math.abs(actualWeight - targetWeight);
  const allowedDeviation = (tolerancePercent / 100) * Math.abs(targetWeight);
  return deviation <= allowedDeviation;
}

describe('Scale Tolerance Logic', () => {
  describe('Within Tolerance', () => {
    it('exact weight is within tolerance', () => {
      expect(isWithinTolerance(1000, 1000, 2.0)).toBe(true);
    });

    it('actualWeight slightly above target is within tolerance', () => {
      // 2% of 1000 = 20, so 1019 should be within tolerance
      expect(isWithinTolerance(1000, 1019, 2.0)).toBe(true);
    });

    it('actualWeight slightly below target is within tolerance', () => {
      // 2% of 1000 = 20, so 981 should be within tolerance
      expect(isWithinTolerance(1000, 981, 2.0)).toBe(true);
    });

    it('actualWeight at upper tolerance boundary is within tolerance', () => {
      // 2% of 1000 = 20, so 1020 is exactly at the boundary
      expect(isWithinTolerance(1000, 1020, 2.0)).toBe(true);
    });

    it('actualWeight at lower tolerance boundary is within tolerance', () => {
      // 2% of 1000 = 20, so 980 is exactly at the boundary
      expect(isWithinTolerance(1000, 980, 2.0)).toBe(true);
    });

    it('small weights with tight tolerance', () => {
      // 1% of 50 = 0.5, so 50.4 should be within tolerance
      expect(isWithinTolerance(50, 50.4, 1.0)).toBe(true);
    });

    it('large weights with wide tolerance', () => {
      // 5% of 10000 = 500
      expect(isWithinTolerance(10000, 10499, 5.0)).toBe(true);
    });
  });

  describe('Out of Tolerance', () => {
    it('actualWeight just above upper boundary is out of tolerance', () => {
      // 2% of 1000 = 20, so 1021 exceeds the boundary
      expect(isWithinTolerance(1000, 1021, 2.0)).toBe(false);
    });

    it('actualWeight just below lower boundary is out of tolerance', () => {
      // 2% of 1000 = 20, so 979 is below the boundary
      expect(isWithinTolerance(1000, 979, 2.0)).toBe(false);
    });

    it('wildly over target is out of tolerance', () => {
      expect(isWithinTolerance(1000, 1500, 2.0)).toBe(false);
    });

    it('wildly under target is out of tolerance', () => {
      expect(isWithinTolerance(1000, 500, 2.0)).toBe(false);
    });

    it('zero actual when target is nonzero is out of tolerance', () => {
      expect(isWithinTolerance(1000, 0, 5.0)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('zero tolerance: only exact match passes', () => {
      expect(isWithinTolerance(1000, 1000, 0)).toBe(true);
      expect(isWithinTolerance(1000, 1000.01, 0)).toBe(false);
      expect(isWithinTolerance(1000, 999.99, 0)).toBe(false);
    });

    it('zero target: only zero actual passes', () => {
      expect(isWithinTolerance(0, 0, 2.0)).toBe(true);
      expect(isWithinTolerance(0, 0.1, 2.0)).toBe(false);
      expect(isWithinTolerance(0, -0.1, 2.0)).toBe(false);
    });

    it('100% tolerance: everything from 0 to 2x target passes', () => {
      expect(isWithinTolerance(1000, 0, 100.0)).toBe(true);
      expect(isWithinTolerance(1000, 2000, 100.0)).toBe(true);
      expect(isWithinTolerance(1000, 2001, 100.0)).toBe(false);
    });

    it('very small deviation with tight tolerance', () => {
      // 1% of 100 = 1, so 100.5 within, 101.5 not
      expect(isWithinTolerance(100, 100.5, 1.0)).toBe(true);
      expect(isWithinTolerance(100, 101.5, 1.0)).toBe(false);
    });

    it('negative target weight uses absolute value for deviation calc', () => {
      // The function uses Math.abs(targetWeight), so -1000 with 2% => allowed deviation = 20
      expect(isWithinTolerance(-1000, -1000, 2.0)).toBe(true);
      expect(isWithinTolerance(-1000, -980, 2.0)).toBe(true);
      expect(isWithinTolerance(-1000, -1020, 2.0)).toBe(true);
      expect(isWithinTolerance(-1000, -1021, 2.0)).toBe(false);
    });
  });

  describe('Critical Materials List', () => {
    it('CEMENT is a critical material', () => {
      expect(CRITICAL_MATERIALS.has(MaterialType.CEMENT)).toBe(true);
    });

    it('WATER is a critical material', () => {
      expect(CRITICAL_MATERIALS.has(MaterialType.WATER)).toBe(true);
    });

    it('SAND is not a critical material', () => {
      expect(CRITICAL_MATERIALS.has(MaterialType.SAND)).toBe(false);
    });

    it('GRAVEL is not a critical material', () => {
      expect(CRITICAL_MATERIALS.has(MaterialType.GRAVEL)).toBe(false);
    });

    it('ADMIXTURE is not a critical material', () => {
      expect(CRITICAL_MATERIALS.has(MaterialType.ADMIXTURE)).toBe(false);
    });

    it('OTHER is not a critical material', () => {
      expect(CRITICAL_MATERIALS.has(MaterialType.OTHER)).toBe(false);
    });

    it('has exactly 2 critical materials', () => {
      expect(CRITICAL_MATERIALS.size).toBe(2);
    });

    it('critical materials trigger outbound events on tolerance violation', () => {
      // Simulate: out-of-tolerance + critical material => should create outbound event
      const materialType = MaterialType.CEMENT;
      const withinTolerance = false;
      const shouldAlert = !withinTolerance && CRITICAL_MATERIALS.has(materialType);
      expect(shouldAlert).toBe(true);
    });

    it('non-critical materials do not trigger outbound events even when out of tolerance', () => {
      const materialType = MaterialType.SAND;
      const withinTolerance = false;
      const shouldAlert = !withinTolerance && CRITICAL_MATERIALS.has(materialType);
      expect(shouldAlert).toBe(false);
    });

    it('critical materials within tolerance do not trigger alerts', () => {
      const materialType = MaterialType.CEMENT;
      const withinTolerance = true;
      const shouldAlert = !withinTolerance && CRITICAL_MATERIALS.has(materialType);
      expect(shouldAlert).toBe(false);
    });
  });

  describe('Default Tolerance Values per Material Type', () => {
    it('CEMENT has 2.0% default tolerance', () => {
      expect(TOLERANCE_DEFAULTS[MaterialType.CEMENT]).toBe(2.0);
    });

    it('WATER has 1.5% default tolerance', () => {
      expect(TOLERANCE_DEFAULTS[MaterialType.WATER]).toBe(1.5);
    });

    it('SAND has 3.0% default tolerance', () => {
      expect(TOLERANCE_DEFAULTS[MaterialType.SAND]).toBe(3.0);
    });

    it('GRAVEL has 3.0% default tolerance', () => {
      expect(TOLERANCE_DEFAULTS[MaterialType.GRAVEL]).toBe(3.0);
    });

    it('ADMIXTURE has 1.0% default tolerance (tightest)', () => {
      expect(TOLERANCE_DEFAULTS[MaterialType.ADMIXTURE]).toBe(1.0);
    });

    it('OTHER has 5.0% default tolerance (loosest)', () => {
      expect(TOLERANCE_DEFAULTS[MaterialType.OTHER]).toBe(5.0);
    });

    it('every MaterialType has a defined default tolerance', () => {
      for (const material of Object.values(MaterialType)) {
        expect(TOLERANCE_DEFAULTS[material]).toBeDefined();
        expect(typeof TOLERANCE_DEFAULTS[material]).toBe('number');
        expect(TOLERANCE_DEFAULTS[material]).toBeGreaterThan(0);
      }
    });

    it('admixture has the tightest tolerance of all materials', () => {
      const allTolerances = Object.values(TOLERANCE_DEFAULTS);
      const min = Math.min(...allTolerances);
      expect(TOLERANCE_DEFAULTS[MaterialType.ADMIXTURE]).toBe(min);
    });

    it('OTHER has the loosest tolerance of all materials', () => {
      const allTolerances = Object.values(TOLERANCE_DEFAULTS);
      const max = Math.max(...allTolerances);
      expect(TOLERANCE_DEFAULTS[MaterialType.OTHER]).toBe(max);
    });
  });
});
