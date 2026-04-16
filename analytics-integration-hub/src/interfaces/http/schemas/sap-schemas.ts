import { z } from 'zod';
import { SapSyncEntityType } from '../../../domain/enums/sap-sync-entity-type.js';

export const TriggerSyncBody = z.object({
  entityType: z.nativeEnum(SapSyncEntityType).optional(),
});

export type TriggerSyncBody = z.infer<typeof TriggerSyncBody>;
