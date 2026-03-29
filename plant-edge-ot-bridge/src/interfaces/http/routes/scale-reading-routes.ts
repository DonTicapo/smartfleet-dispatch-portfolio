import type { FastifyInstance } from 'fastify';
import { RecordScaleReadingBody, ScaleReadingQueryParams } from '../schemas/scale-reading-schemas.js';
import type { ScaleReadingService } from '../../../application/services/scale-reading-service.js';
import type { MaterialType } from '../../../domain/enums/material-type.js';
import type { WeightUnit } from '../../../domain/enums/weight-unit.js';

export function registerScaleReadingRoutes(app: FastifyInstance, service: ScaleReadingService): void {
  app.post('/edge/scale-readings', async (request, reply) => {
    const body = RecordScaleReadingBody.parse(request.body);
    const inputs = Array.isArray(body) ? body : [body];
    const readings = await service.record(
      inputs.map((item) => ({
        ...item,
        materialType: item.materialType as MaterialType,
        unit: item.unit as WeightUnit,
      })),
      request.principal.sub,
    );
    reply.code(201).send(readings);
  });

  app.get('/edge/scale-readings', async (request) => {
    const params = ScaleReadingQueryParams.parse(request.query);
    return service.query({
      plantId: params.plantId,
      mixerId: params.mixerId,
      batchNumber: params.batchNumber,
      materialType: params.materialType as MaterialType | undefined,
      withinTolerance: params.withinTolerance,
      limit: params.limit,
      offset: params.offset,
    });
  });
}
