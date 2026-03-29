import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';

export function registerRequestId(app: FastifyInstance): void {
  app.addHook('onRequest', async (request) => {
    const requestId = (request.headers['x-request-id'] as string) || randomUUID();
    request.headers['x-request-id'] = requestId;
  });

  app.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.headers['x-request-id']);
  });
}
