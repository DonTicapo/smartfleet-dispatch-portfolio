import type { FastifyInstance } from 'fastify';
import { CreateKpiDefinitionBody, ComputeKpiBody, KpiSnapshotQueryParams } from '../schemas/kpi-schemas.js';
import type { KpiService } from '../../../application/services/kpi-service.js';

export function registerKpiRoutes(app: FastifyInstance, service: KpiService): void {
  app.get('/kpis/definitions', async () => {
    const definitions = await service.listDefinitions();
    return { data: definitions, count: definitions.length };
  });

  app.post('/kpis/definitions', async (request, reply) => {
    const body = CreateKpiDefinitionBody.parse(request.body);
    const definition = await service.createDefinition(body, request.principal.sub);
    reply.code(201).send(definition);
  });

  app.get('/kpis/snapshots', async (request) => {
    const params = KpiSnapshotQueryParams.parse(request.query);
    const snapshots = await service.querySnapshots(params);
    return { data: snapshots, count: snapshots.length };
  });

  app.post('/kpis/compute', async (request, reply) => {
    const body = ComputeKpiBody.parse(request.body);
    const snapshots = await service.computeKpis(body, request.principal.sub);
    reply.code(201).send({ data: snapshots, count: snapshots.length });
  });

  app.get('/kpis/plants', async () => {
    const snapshots = await service.getPlantDashboard();
    return { data: snapshots, count: snapshots.length };
  });

  app.get('/kpis/dispatch', async () => {
    const snapshots = await service.getDispatchDashboard();
    return { data: snapshots, count: snapshots.length };
  });
}
