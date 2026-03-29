export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entityType: string, id: string) {
    super('ENTITY_NOT_FOUND', `${entityType} with id '${id}' not found`);
    this.name = 'EntityNotFoundError';
  }
}

export class InvalidTransitionError extends DomainError {
  constructor(entityType: string, id: string, from: string, to: string) {
    super(
      'INVALID_TRANSITION',
      `Cannot transition ${entityType} '${id}' from '${from}' to '${to}'`,
    );
    this.name = 'InvalidTransitionError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message);
    this.name = 'ValidationError';
  }
}

export class DuplicateEntityError extends DomainError {
  constructor(entityType: string, field: string, value: string) {
    super('DUPLICATE_ENTITY', `${entityType} with ${field} '${value}' already exists`);
    this.name = 'DuplicateEntityError';
  }
}
