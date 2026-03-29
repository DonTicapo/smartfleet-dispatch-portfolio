import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';

export function registerRequestId(app: FastifyInstance): void {
  app.addHook('onRequest', async (request) => {
    request.headers['x-request-id'] = (request.headers['x-request-id'] as string) || randomUUID();
  });
  app.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.headers['x-request-id']);
  });
}
