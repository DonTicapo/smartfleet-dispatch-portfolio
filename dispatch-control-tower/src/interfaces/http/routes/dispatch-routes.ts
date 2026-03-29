import type { FastifyInstance } from 'fastify';
import { CreateAssignmentBody, CancelAssignmentBody, CreateExceptionBody, UpdateExceptionBody, RefreshBoardBody } from '../schemas/dispatch-schemas.js';
import type { AssignmentService } from '../../../application/services/assignment-service.js';
import type { ExceptionService } from '../../../application/services/exception-service.js';
import type { DispatchBoardService } from '../../../application/services/dispatch-board-service.js';
import type { ExceptionStatus } from '../../../domain/enums/exception-status.js';

export function registerDispatchRoutes(
  app: FastifyInstance,
  assignmentService: AssignmentService,
  exceptionService: ExceptionService,
  boardService: DispatchBoardService,
): void {
  // Assignments
  app.post('/dispatch/assignments', async (req, reply) => {
    const body = CreateAssignmentBody.parse(req.body);
    reply.code(201).send(await assignmentService.create(body, req.principal.sub));
  });
  app.get('/dispatch/assignments/:id', async (req) => assignmentService.getById((req.params as { id: string }).id));
  app.patch('/dispatch/assignments/:id/cancel', async (req) => {
    const body = CancelAssignmentBody.parse(req.body);
    return assignmentService.cancel((req.params as { id: string }).id, body.reason, req.principal.sub);
  });

  // Exceptions
  app.post('/dispatch/exceptions', async (req, reply) => {
    const body = CreateExceptionBody.parse(req.body);
    reply.code(201).send(await exceptionService.create(body, req.principal.sub));
  });
  app.get('/dispatch/exceptions', async (req) => {
    const { status, type, loadId } = req.query as { status?: string; type?: string; loadId?: string };
    return exceptionService.list({ status, type, loadId });
  });
  app.get('/dispatch/exceptions/:id', async (req) => exceptionService.getById((req.params as { id: string }).id));
  app.patch('/dispatch/exceptions/:id', async (req) => {
    const body = UpdateExceptionBody.parse(req.body);
    return exceptionService.transition((req.params as { id: string }).id, body.status as ExceptionStatus, req.principal.sub, body.resolution ?? undefined);
  });

  // Board
  app.get('/dispatch/board', async (req) => {
    const { date } = req.query as { date?: string };
    return boardService.getBoard(date || new Date().toISOString().slice(0, 10));
  });
  app.post('/dispatch/board/refresh', async (req) => {
    const body = RefreshBoardBody.parse(req.body ?? {});
    return boardService.refresh(body.date || new Date().toISOString().slice(0, 10));
  });
}
