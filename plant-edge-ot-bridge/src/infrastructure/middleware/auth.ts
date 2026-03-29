import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { getConfig } from '../../config.js';

declare module 'fastify' {
  interface FastifyRequest {
    principal: { sub: string; role: string };
  }
}

export function registerAuth(app: FastifyInstance): void {
  app.decorateRequest('principal', { sub: '', role: '' } as { sub: string; role: string });

  app.addHook('onRequest', async (request, reply) => {
    // Health endpoint is public
    if (request.url === '/health') return;

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Missing or invalid authorization header' });
      return;
    }

    try {
      const token = authHeader.slice(7);
      const config = getConfig();
      const decoded = jwt.verify(token, config.JWT_SECRET) as { sub: string; role: string };
      request.principal = { sub: decoded.sub, role: decoded.role };
    } catch {
      reply.code(401).send({ error: 'Invalid token' });
    }
  });
}
