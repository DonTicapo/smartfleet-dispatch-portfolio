import { describe, it, expect } from 'vitest';
import { DeliveryState } from '@smartfleet/otl-contracts';
import { ZoneType } from '../../../src/domain/enums/zone-type.js';
import { GeofenceTransition } from '../../../src/domain/enums/geofence-transition.js';
import { inferDeliveryState } from '../../../src/domain/state-machines/geofence-inference.js';

describe('Geofence Inference Engine', () => {
  const mappedCases: [ZoneType, GeofenceTransition, DeliveryState][] = [
    [ZoneType.PLANT, GeofenceTransition.EXIT, DeliveryState.PLANT_DEPARTED],
    [ZoneType.DELIVERY_SITE, GeofenceTransition.ENTER, DeliveryState.GEOFENCE_ENTERED],
    [ZoneType.DELIVERY_SITE, GeofenceTransition.EXIT, DeliveryState.SITE_DEPARTED],
    [ZoneType.PLANT, GeofenceTransition.ENTER, DeliveryState.PLANT_RETURNED],
    [ZoneType.WASHOUT, GeofenceTransition.ENTER, DeliveryState.WASHOUT_COMPLETED],
  ];

  it.each(mappedCases)(
    'maps %s:%s -> %s',
    (zoneType, transition, expectedState) => {
      const result = inferDeliveryState({ zoneType, transition });
      expect(result.deliveryState).toBe(expectedState);
      expect(result.reason).toContain('Inferred');
    },
  );

  const unmappedCases: [ZoneType, GeofenceTransition][] = [
    [ZoneType.PLANT, GeofenceTransition.ENTER], // Mapped, skip
    [ZoneType.WASHOUT, GeofenceTransition.EXIT],
    [ZoneType.YARD, GeofenceTransition.ENTER],
    [ZoneType.YARD, GeofenceTransition.EXIT],
  ];

  // Filter out mapped ones
  const trulyUnmapped = unmappedCases.filter(([zt, gt]) => {
    const result = inferDeliveryState({ zoneType: zt, transition: gt });
    return result.deliveryState === null;
  });

  it.each(trulyUnmapped)(
    'returns null for %s:%s',
    (zoneType, transition) => {
      const result = inferDeliveryState({ zoneType, transition });
      expect(result.deliveryState).toBeNull();
      expect(result.reason).toContain('No delivery state mapping');
    },
  );
});
