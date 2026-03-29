import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
    correlationId: string;
  }
}

export function registerRequestId(app: FastifyInstance): void {
  app.decorateRequest('requestId', '');
  app.decorateRequest('correlationId', '');

  app.addHook('onRequest', async (request) => {
    const requestId = (request.headers['x-request-id'] as string) || randomUUID();
    const correlationId = (request.headers['x-correlation-id'] as string) || requestId;
    request.headers['x-request-id'] = requestId;
    request.headers['x-correlation-id'] = correlationId;
    request.requestId = requestId;
    request.correlationId = correlationId;
  });

  app.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.requestId);
    reply.header('x-correlation-id', request.correlationId);
  });
}
