import type { FastifyInstance } from 'fastify';
import { TicketIdParam } from '../schemas/ticket-schemas.js';
import type { TicketViewService } from '../../../application/services/ticket-view-service.js';
import type { LoadTrackerService } from '../../../application/services/load-tracker-service.js';

export function registerTicketRoutes(
  app: FastifyInstance,
  ticketViewService: TicketViewService,
  loadTrackerService: LoadTrackerService,
): void {
  app.get('/portal/tickets/:ticketId', async (request) => {
    const { ticketId } = TicketIdParam.parse(request.params);
    const { customerId } = request.principal;

    const ticket = await ticketViewService.getById(ticketId, customerId);
    const loads = await loadTrackerService.listByTicketId(ticketId, customerId);

    return {
      ...ticket,
      loads,
    };
  });

  app.get('/portal/tickets/:ticketId/loads', async (request) => {
    const { ticketId } = TicketIdParam.parse(request.params);
    const { customerId } = request.principal;
    return loadTrackerService.listByTicketId(ticketId, customerId);
  });
}
