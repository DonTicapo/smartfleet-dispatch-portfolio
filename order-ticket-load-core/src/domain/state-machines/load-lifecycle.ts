import { LoadStatus } from '../enums/load-status.js';
import { DeliveryState } from '../enums/delivery-state.js';
import { InvalidTransitionError } from '../errors/domain-error.js';
import type { Load } from '../entities/load.js';

const TRANSITIONS = new Map<LoadStatus, Set<LoadStatus>>([
  [LoadStatus.SCHEDULED, new Set([LoadStatus.LOADING, LoadStatus.CANCELLED])],
  [LoadStatus.LOADING, new Set([LoadStatus.LOADED, LoadStatus.CANCELLED])],
  [LoadStatus.LOADED, new Set([LoadStatus.EN_ROUTE, LoadStatus.CANCELLED])],
  [LoadStatus.EN_ROUTE, new Set([LoadStatus.ON_SITE, LoadStatus.CANCELLED])],
  [LoadStatus.ON_SITE, new Set([LoadStatus.POURING, LoadStatus.REJECTED, LoadStatus.CANCELLED])],
  [LoadStatus.POURING, new Set([LoadStatus.RETURNING, LoadStatus.CANCELLED])],
  [LoadStatus.RETURNING, new Set([LoadStatus.COMPLETED])],
  [LoadStatus.COMPLETED, new Set()],
  [LoadStatus.CANCELLED, new Set()],
  [LoadStatus.REJECTED, new Set()],
]);

const DELIVERY_STATE_TO_LOAD_STATUS = new Map<DeliveryState, LoadStatus>([
  [DeliveryState.PLANT_DEPARTED, LoadStatus.EN_ROUTE],
  [DeliveryState.ON_SITE_ARRIVED, LoadStatus.ON_SITE],
  [DeliveryState.POUR_STARTED, LoadStatus.POURING],
  [DeliveryState.POUR_COMPLETED, LoadStatus.RETURNING],
  [DeliveryState.PLANT_RETURNED, LoadStatus.COMPLETED],
]);

export function canTransition(from: LoadStatus, to: LoadStatus): boolean {
  const allowed = TRANSITIONS.get(from);
  return allowed !== undefined && allowed.has(to);
}

export function transitionLoad(load: Load, to: LoadStatus): Load {
  if (!canTransition(load.status, to)) {
    throw new InvalidTransitionError('Load', load.id, load.status, to);
  }
  return { ...load, status: to, updatedAt: new Date() };
}

export function getLoadStatusForDeliveryState(
  deliveryState: DeliveryState,
): LoadStatus | null {
  return DELIVERY_STATE_TO_LOAD_STATUS.get(deliveryState) ?? null;
}

export function isTerminalStatus(status: LoadStatus): boolean {
  const allowed = TRANSITIONS.get(status);
  return allowed !== undefined && allowed.size === 0;
}
