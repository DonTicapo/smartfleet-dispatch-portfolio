import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { getConfig } from '../../config.js';

declare module 'fastify' {
  interface FastifyRequest {
    principal: { sub: string; role: string; customerId: string };
  }
}

const PUBLIC_PATHS = ['/health', '/portal/auth/login'];

export function registerAuth(app: FastifyInstance): void {
  app.decorateRequest('principal', null as unknown as { sub: string; role: string; customerId: string });

  app.addHook('onRequest', async (request, reply) => {
    // Public endpoints do not require auth
    if (PUBLIC_PATHS.some((path) => request.url === path || request.url.startsWith(path + '?'))) {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Missing or invalid authorization header' });
      return;
    }

    try {
      const token = authHeader.slice(7);
      const config = getConfig();
      const decoded = jwt.verify(token, config.JWT_SECRET) as {
        sub: string;
        role: string;
        customerId: string;
      };
      request.principal = {
        sub: decoded.sub,
        role: decoded.role,
        customerId: decoded.customerId,
      };
    } catch {
      reply.code(401).send({ error: 'Invalid token' });
    }
  });
}
