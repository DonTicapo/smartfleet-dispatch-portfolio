import { describe, it, expect } from 'vitest';
import { ExceptionStatus } from '../../../src/domain/enums/exception-status.js';
import { canTransitionException, assertExceptionTransition, isTerminalException } from '../../../src/domain/state-machines/exception-lifecycle.js';
import { InvalidTransitionError } from '../../../src/domain/errors/domain-error.js';

describe('Exception Lifecycle State Machine', () => {
  const valid: [ExceptionStatus, ExceptionStatus][] = [
    [ExceptionStatus.OPEN, ExceptionStatus.ACKNOWLEDGED],
    [ExceptionStatus.OPEN, ExceptionStatus.IN_PROGRESS],
    [ExceptionStatus.OPEN, ExceptionStatus.RESOLVED],
    [ExceptionStatus.ACKNOWLEDGED, ExceptionStatus.IN_PROGRESS],
    [ExceptionStatus.ACKNOWLEDGED, ExceptionStatus.RESOLVED],
    [ExceptionStatus.IN_PROGRESS, ExceptionStatus.RESOLVED],
    [ExceptionStatus.RESOLVED, ExceptionStatus.CLOSED],
  ];

  it.each(valid)('allows %s -> %s', (from, to) => {
    expect(canTransitionException(from, to)).toBe(true);
  });

  const invalid: [ExceptionStatus, ExceptionStatus][] = [
    [ExceptionStatus.CLOSED, ExceptionStatus.OPEN],
    [ExceptionStatus.RESOLVED, ExceptionStatus.OPEN],
    [ExceptionStatus.IN_PROGRESS, ExceptionStatus.ACKNOWLEDGED],
    [ExceptionStatus.CLOSED, ExceptionStatus.RESOLVED],
  ];

  it.each(invalid)('rejects %s -> %s', (from, to) => {
    expect(canTransitionException(from, to)).toBe(false);
  });

  it('assertExceptionTransition throws on invalid', () => {
    expect(() => assertExceptionTransition('test-id', ExceptionStatus.CLOSED, ExceptionStatus.OPEN)).toThrow(InvalidTransitionError);
  });

  it('identifies terminal states', () => {
    expect(isTerminalException(ExceptionStatus.CLOSED)).toBe(true);
    expect(isTerminalException(ExceptionStatus.OPEN)).toBe(false);
    expect(isTerminalException(ExceptionStatus.RESOLVED)).toBe(false);
  });
});
