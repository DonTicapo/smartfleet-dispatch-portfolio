import { MixerStatus } from '../enums/mixer-status.js';
import { InvalidTransitionError } from '../errors/domain-error.js';
import type { Mixer } from '../entities/mixer.js';

const TRANSITIONS = new Map<MixerStatus, Set<MixerStatus>>([
  [MixerStatus.IDLE, new Set([MixerStatus.MIXING, MixerStatus.CLEANING, MixerStatus.MAINTENANCE])],
  [MixerStatus.MIXING, new Set([MixerStatus.IDLE, MixerStatus.FAULT])],
  [MixerStatus.CLEANING, new Set([MixerStatus.IDLE])],
  [MixerStatus.MAINTENANCE, new Set([MixerStatus.IDLE])],
  [MixerStatus.FAULT, new Set([MixerStatus.MAINTENANCE, MixerStatus.IDLE])],
]);

export function canTransition(from: MixerStatus, to: MixerStatus): boolean {
  const allowed = TRANSITIONS.get(from);
  return allowed !== undefined && allowed.has(to);
}

export function transitionMixer(mixer: Mixer, to: MixerStatus): Mixer {
  if (!canTransition(mixer.status, to)) {
    throw new InvalidTransitionError('Mixer', mixer.id, mixer.status, to);
  }
  return { ...mixer, status: to, lastStatusAt: new Date(), updatedAt: new Date() };
}

export function isFaultStatus(status: MixerStatus): boolean {
  return status === MixerStatus.FAULT;
}
