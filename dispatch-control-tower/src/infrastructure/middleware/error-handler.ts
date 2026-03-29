import type { FastifyInstance } from 'fastify';
import { DomainError, EntityNotFoundError, InvalidTransitionError, ValidationError, DuplicateEntityError } from '../../domain/errors/domain-error.js';
import { ZodError } from 'zod';

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof EntityNotFoundError) { reply.code(404).send({ error: error.code, message: error.message }); return; }
    if (error instanceof InvalidTransitionError) { reply.code(409).send({ error: error.code, message: error.message }); return; }
    if (error instanceof DuplicateEntityError) { reply.code(409).send({ error: error.code, message: error.message }); return; }
    if (error instanceof ValidationError) { reply.code(400).send({ error: error.code, message: error.message }); return; }
    if (error instanceof ZodError) { reply.code(400).send({ error: 'VALIDATION_ERROR', message: error.errors }); return; }
    if (error instanceof DomainError) { reply.code(400).send({ error: error.code, message: error.message }); return; }
    app.log.error(error);
    reply.code(500).send({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
  });
}
