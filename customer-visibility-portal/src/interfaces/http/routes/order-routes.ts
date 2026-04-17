import type { FastifyInstance } from 'fastify';
import { ListOrdersQuery, OrderIdParam } from '../schemas/order-schemas.js';
import type { OrderViewService } from '../../../application/services/order-view-service.js';
import type { TicketViewService } from '../../../application/services/ticket-view-service.js';

export function registerOrderRoutes(
  app: FastifyInstance,
  orderViewService: OrderViewService,
  ticketViewService: TicketViewService,
): void {
  app.get('/portal/orders', async (request) => {
    const query = ListOrdersQuery.parse(request.query);
    const { customerId } = request.principal;
    return orderViewService.listByCustomer(customerId, query);
  });

  app.get('/portal/orders/:orderId', async (request) => {
    const { orderId } = OrderIdParam.parse(request.params);
    const { customerId } = request.principal;

    const order = await orderViewService.getById(orderId, customerId);
    const tickets = await ticketViewService.listByOrderId(orderId, customerId);

    return {
      ...order,
      tickets,
    };
  });

  app.get('/portal/orders/:orderId/tickets', async (request) => {
    const { orderId } = OrderIdParam.parse(request.params);
    const { customerId } = request.principal;
    return ticketViewService.listByOrderId(orderId, customerId);
  });
}
