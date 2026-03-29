import { ExceptionStatus } from '../enums/exception-status.js';
import { InvalidTransitionError } from '../errors/domain-error.js';

const TRANSITIONS = new Map<ExceptionStatus, Set<ExceptionStatus>>([
  [ExceptionStatus.OPEN, new Set([ExceptionStatus.ACKNOWLEDGED, ExceptionStatus.IN_PROGRESS, ExceptionStatus.RESOLVED])],
  [ExceptionStatus.ACKNOWLEDGED, new Set([ExceptionStatus.IN_PROGRESS, ExceptionStatus.RESOLVED])],
  [ExceptionStatus.IN_PROGRESS, new Set([ExceptionStatus.RESOLVED])],
  [ExceptionStatus.RESOLVED, new Set([ExceptionStatus.CLOSED])],
  [ExceptionStatus.CLOSED, new Set()],
]);

export function canTransitionException(from: ExceptionStatus, to: ExceptionStatus): boolean {
  const allowed = TRANSITIONS.get(from);
  return allowed !== undefined && allowed.has(to);
}

export function assertExceptionTransition(id: string, from: ExceptionStatus, to: ExceptionStatus): void {
  if (!canTransitionException(from, to)) {
    throw new InvalidTransitionError('DispatchException', id, from, to);
  }
}

export function isTerminalException(status: ExceptionStatus): boolean {
  const allowed = TRANSITIONS.get(status);
  return allowed !== undefined && allowed.size === 0;
}
