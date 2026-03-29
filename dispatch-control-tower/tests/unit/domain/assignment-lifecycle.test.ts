import { describe, it, expect } from 'vitest';
import { AssignmentStatus } from '../../../src/domain/enums/assignment-status.js';
import { canTransitionAssignment, assertAssignmentTransition, isTerminalAssignment } from '../../../src/domain/state-machines/assignment-lifecycle.js';
import { InvalidTransitionError } from '../../../src/domain/errors/domain-error.js';

describe('Assignment Lifecycle State Machine', () => {
  const valid: [AssignmentStatus, AssignmentStatus][] = [
    [AssignmentStatus.PENDING, AssignmentStatus.CONFIRMED],
    [AssignmentStatus.PENDING, AssignmentStatus.CANCELLED],
    [AssignmentStatus.CONFIRMED, AssignmentStatus.IN_PROGRESS],
    [AssignmentStatus.CONFIRMED, AssignmentStatus.CANCELLED],
    [AssignmentStatus.IN_PROGRESS, AssignmentStatus.COMPLETED],
    [AssignmentStatus.IN_PROGRESS, AssignmentStatus.CANCELLED],
  ];

  it.each(valid)('allows %s -> %s', (from, to) => {
    expect(canTransitionAssignment(from, to)).toBe(true);
  });

  const invalid: [AssignmentStatus, AssignmentStatus][] = [
    [AssignmentStatus.COMPLETED, AssignmentStatus.PENDING],
    [AssignmentStatus.CANCELLED, AssignmentStatus.CONFIRMED],
    [AssignmentStatus.PENDING, AssignmentStatus.COMPLETED],
    [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS],
  ];

  it.each(invalid)('rejects %s -> %s', (from, to) => {
    expect(canTransitionAssignment(from, to)).toBe(false);
  });

  it('assertAssignmentTransition throws on invalid', () => {
    expect(() => assertAssignmentTransition('test-id', AssignmentStatus.COMPLETED, AssignmentStatus.PENDING)).toThrow(InvalidTransitionError);
  });

  it('identifies terminal states', () => {
    expect(isTerminalAssignment(AssignmentStatus.COMPLETED)).toBe(true);
    expect(isTerminalAssignment(AssignmentStatus.CANCELLED)).toBe(true);
    expect(isTerminalAssignment(AssignmentStatus.PENDING)).toBe(false);
  });
});
