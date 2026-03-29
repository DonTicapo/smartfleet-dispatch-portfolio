import { DeliveryState } from '@smartfleet/otl-contracts';
import { ZoneType } from '../enums/zone-type.js';
import { GeofenceTransition } from '../enums/geofence-transition.js';

export interface InferenceInput {
  zoneType: ZoneType;
  transition: GeofenceTransition;
}

export interface InferenceResult {
  deliveryState: DeliveryState | null;
  reason: string;
}

const INFERENCE_MAP = new Map<string, DeliveryState>([
  [`${ZoneType.PLANT}:${GeofenceTransition.EXIT}`, DeliveryState.PLANT_DEPARTED],
  [`${ZoneType.DELIVERY_SITE}:${GeofenceTransition.ENTER}`, DeliveryState.GEOFENCE_ENTERED],
  [`${ZoneType.DELIVERY_SITE}:${GeofenceTransition.EXIT}`, DeliveryState.SITE_DEPARTED],
  [`${ZoneType.PLANT}:${GeofenceTransition.ENTER}`, DeliveryState.PLANT_RETURNED],
  [`${ZoneType.WASHOUT}:${GeofenceTransition.ENTER}`, DeliveryState.WASHOUT_COMPLETED],
]);

export function inferDeliveryState(input: InferenceInput): InferenceResult {
  const key = `${input.zoneType}:${input.transition}`;
  const state = INFERENCE_MAP.get(key) ?? null;
  return {
    deliveryState: state,
    reason: state
      ? `Inferred ${state} from ${key}`
      : `No delivery state mapping for ${key}`,
  };
}
