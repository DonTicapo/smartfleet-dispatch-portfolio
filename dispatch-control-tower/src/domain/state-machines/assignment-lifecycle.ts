import { AssignmentStatus } from '../enums/assignment-status.js';
import { InvalidTransitionError } from '../errors/domain-error.js';

const TRANSITIONS = new Map<AssignmentStatus, Set<AssignmentStatus>>([
  [AssignmentStatus.PENDING, new Set([AssignmentStatus.CONFIRMED, AssignmentStatus.CANCELLED])],
  [AssignmentStatus.CONFIRMED, new Set([AssignmentStatus.IN_PROGRESS, AssignmentStatus.CANCELLED])],
  [AssignmentStatus.IN_PROGRESS, new Set([AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED])],
  [AssignmentStatus.COMPLETED, new Set()],
  [AssignmentStatus.CANCELLED, new Set()],
]);

export function canTransitionAssignment(from: AssignmentStatus, to: AssignmentStatus): boolean {
  const allowed = TRANSITIONS.get(from);
  return allowed !== undefined && allowed.has(to);
}

export function assertAssignmentTransition(id: string, from: AssignmentStatus, to: AssignmentStatus): void {
  if (!canTransitionAssignment(from, to)) {
    throw new InvalidTransitionError('Assignment', id, from, to);
  }
}

export function isTerminalAssignment(status: AssignmentStatus): boolean {
  const allowed = TRANSITIONS.get(status);
  return allowed !== undefined && allowed.size === 0;
}
