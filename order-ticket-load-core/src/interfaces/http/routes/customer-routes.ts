import type { FastifyInstance } from 'fastify';
import { CreateCustomerBody } from '../schemas/customer-schemas.js';
import type { CustomerService } from '../../../application/services/customer-service.js';

export function registerCustomerRoutes(app: FastifyInstance, service: CustomerService): void {
  app.post('/customers', async (request, reply) => {
    const body = CreateCustomerBody.parse(request.body);
    const customer = await service.create(body, request.principal.sub);
    reply.code(201).send(customer);
  });

  app.get('/customers/:id', async (request) => {
    const { id } = request.params as { id: string };
    return service.getById(id);
  });
}
