import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CreatePlantBody, CreateMixerBody, UpdateMixerBody } from '../schemas/plant-schemas.js';
import type { PlantService } from '../../../application/services/plant-service.js';
import type { PlantRepository } from '../../../infrastructure/repositories/plant-repository.js';
import type { AuditLogRepository } from '../../../infrastructure/repositories/audit-log-repository.js';
import type { MixerType } from '../../../domain/enums/mixer-type.js';

const ImportPlantBody = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  location: z.object({ latitude: z.number(), longitude: z.number(), city: z.string().optional() }).nullish(),
  timezone: z.string().default('America/Tegucigalpa'),
  isActive: z.boolean().default(true),
});

export function registerPlantImportRoute(
  app: FastifyInstance,
  plantRepo: PlantRepository,
  auditRepo: AuditLogRepository,
): void {
  app.put('/plants/import', async (request, reply) => {
    const body = ImportPlantBody.parse(request.body);
    const plant = await plantRepo.upsertByCode({
      code: body.code,
      name: body.name,
      location: body.location
        ? { lat: body.location.latitude, lon: body.location.longitude, address: body.location.city ?? null }
        : null,
      timezone: body.timezone,
      isActive: body.isActive,
    });

    await auditRepo.log({
      entityType: 'Plant',
      entityId: plant.id,
      action: 'IMPORT',
      actor: request.principal.sub,
    });

    reply.code(200).send(plant);
  });
}

export function registerPlantRoutes(app: FastifyInstance, service: PlantService): void {
  app.get('/edge/plants', async (request) => {
    const query = request.query as { activeOnly?: string };
    const activeOnly = query.activeOnly === 'true';
    return service.listPlants(activeOnly);
  });

  app.post('/edge/plants', async (request, reply) => {
    const body = CreatePlantBody.parse(request.body);
    const plant = await service.createPlant(body, request.principal.sub);
    reply.code(201).send(plant);
  });

  app.get('/edge/plants/:plantId/mixers', async (request) => {
    const { plantId } = request.params as { plantId: string };
    return service.listMixers(plantId);
  });

  app.post('/edge/plants/:plantId/mixers', async (request, reply) => {
    const { plantId } = request.params as { plantId: string };
    const body = CreateMixerBody.parse(request.body);
    const mixer = await service.createMixer(
      plantId,
      { ...body, type: body.type as MixerType },
      request.principal.sub,
    );
    reply.code(201).send(mixer);
  });

  app.patch('/edge/plants/:plantId/mixers/:mixerId', async (request) => {
    const { plantId, mixerId } = request.params as { plantId: string; mixerId: string };
    const body = UpdateMixerBody.parse(request.body);
    return service.updateMixer(
      plantId,
      mixerId,
      { ...body, type: body.type as MixerType | undefined },
      request.principal.sub,
    );
  });
}
