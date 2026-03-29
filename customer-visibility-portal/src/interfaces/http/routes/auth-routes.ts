import type { FastifyInstance } from 'fastify';
import { LoginBody } from '../schemas/auth-schemas.js';
import type { AuthService } from '../../../application/services/auth-service.js';

export function registerAuthRoutes(app: FastifyInstance, authService: AuthService): void {
  app.post('/portal/auth/login', async (request, reply) => {
    const body = LoginBody.parse(request.body);
    const result = await authService.login(body);
    reply.code(200).send(result);
  });
}
