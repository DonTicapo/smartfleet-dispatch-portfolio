import type { FastifyInstance } from 'fastify';
import { CreateErpExportBody, ListExportsQueryParams } from '../schemas/erp-schemas.js';
import type { ErpExportService } from '../../../application/services/erp-export-service.js';

export function registerErpRoutes(app: FastifyInstance, service: ErpExportService): void {
  app.post('/integrations/erp/export', async (request, reply) => {
    const body = CreateErpExportBody.parse(request.body);
    const job = await service.createExport(body, request.principal.sub);
    reply.code(201).send(job);
  });

  app.get('/integrations/erp/exports', async (request) => {
    const params = ListExportsQueryParams.parse(request.query);
    const jobs = await service.listExports(params.limit, params.offset);
    return { data: jobs, count: jobs.length };
  });

  app.get('/integrations/erp/exports/:exportId', async (request) => {
    const { exportId } = request.params as { exportId: string };
    return service.getExport(exportId);
  });
}
