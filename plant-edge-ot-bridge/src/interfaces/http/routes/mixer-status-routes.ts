import type { FastifyInstance } from 'fastify';
import { RecordMixerStatusBody, MixerStatusHistoryParams } from '../schemas/mixer-status-schemas.js';
import type { MixerStatusService } from '../../../application/services/mixer-status-service.js';
import type { MixerStatus } from '../../../domain/enums/mixer-status.js';

export function registerMixerStatusRoutes(app: FastifyInstance, service: MixerStatusService): void {
  app.post('/edge/mixer-status', async (request, reply) => {
    const body = RecordMixerStatusBody.parse(request.body);
    const log = await service.recordStatusChange(
      {
        ...body,
        status: body.status as MixerStatus,
      },
      request.principal.sub,
    );
    reply.code(201).send(log);
  });

  app.get('/edge/mixer-status/:mixerId/current', async (request) => {
    const { mixerId } = request.params as { mixerId: string };
    return service.getCurrentStatus(mixerId);
  });

  app.get('/edge/mixer-status/:mixerId/history', async (request) => {
    const { mixerId } = request.params as { mixerId: string };
    const params = MixerStatusHistoryParams.parse(request.query);
    return service.getStatusHistory(mixerId, {
      limit: params.limit,
      offset: params.offset,
    });
  });
}
