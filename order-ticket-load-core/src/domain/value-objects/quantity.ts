import { UnitOfMeasure } from '../enums/unit-of-measure.js';

export interface Quantity {
  amount: number;
  unit: UnitOfMeasure;
}
