import { MaterialType } from '../enums/material-type.js';

export const TOLERANCE_DEFAULTS: Record<MaterialType, number> = {
  [MaterialType.CEMENT]: 2.0,
  [MaterialType.WATER]: 1.5,
  [MaterialType.SAND]: 3.0,
  [MaterialType.GRAVEL]: 3.0,
  [MaterialType.ADMIXTURE]: 1.0,
  [MaterialType.OTHER]: 5.0,
};

/** Critical materials that trigger outbound alerts when out of tolerance. */
export const CRITICAL_MATERIALS: ReadonlySet<MaterialType> = new Set([
  MaterialType.CEMENT,
  MaterialType.WATER,
]);
