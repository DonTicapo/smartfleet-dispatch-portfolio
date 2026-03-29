import type { Knex } from 'knex';
import type { ScaleReading } from '../../domain/entities/scale-reading.js';
import type { MaterialType } from '../../domain/enums/material-type.js';
import type { WeightUnit } from '../../domain/enums/weight-unit.js';
import { OutboundStatus } from '../../domain/enums/outbound-status.js';
import { OutboundTarget } from '../../domain/enums/outbound-target.js';
import { EntityNotFoundError, ValidationError } from '../../domain/errors/domain-error.js';
import { TOLERANCE_DEFAULTS, CRITICAL_MATERIALS } from '../../domain/value-objects/tolerance-defaults.js';
import type { ScaleReadingRepository, ScaleReadingFilters } from '../../infrastructure/repositories/scale-reading-repository.js';
import type { PlantRepository } from '../../infrastructure/repositories/plant-repository.js';
import type { MixerRepository } from '../../infrastructure/repositories/mixer-repository.js';
import type { OutboundEventRepository } from '../../infrastructure/repositories/outbound-event-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export interface RecordScaleReadingInput {
  plantId: string;
  mixerId: string;
  batchNumber?: string | null;
  materialType: MaterialType;
  targetWeight: number;
  actualWeight: number;
  unit: WeightUnit;
  tolerance?: number;
  recordedAt: string | Date;
}

/**
 * Checks if actualWeight is within tolerance% of targetWeight.
 * tolerance is a percentage (e.g. 2.0 means +/- 2%).
 */
function isWithinTolerance(targetWeight: number, actualWeight: number, tolerancePercent: number): boolean {
  if (targetWeight === 0) return actualWeight === 0;
  const deviation = Math.abs(actualWeight - targetWeight);
  const allowedDeviation = (tolerancePercent / 100) * Math.abs(targetWeight);
  return deviation <= allowedDeviation;
}

export class ScaleReadingService {
  constructor(
    private db: Knex,
    private scaleReadingRepo: ScaleReadingRepository,
    private plantRepo: PlantRepository,
    private mixerRepo: MixerRepository,
    private outboundRepo: OutboundEventRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async record(input: RecordScaleReadingInput | RecordScaleReadingInput[], actor: string): Promise<ScaleReading[]> {
    const inputs = Array.isArray(input) ? input : [input];

    if (inputs.length === 0) {
      throw new ValidationError('At least one scale reading is required');
    }

    return this.db.transaction(async (trx) => {
      const results: ScaleReading[] = [];
      const outOfToleranceCritical: Array<{ reading: ScaleReading; plantCode: string }> = [];

      for (const item of inputs) {
        // Validate plant
        const plant = await this.plantRepo.findById(item.plantId);
        if (!plant) throw new EntityNotFoundError('Plant', item.plantId);

        // Validate mixer belongs to plant
        const mixer = await this.mixerRepo.findById(item.mixerId);
        if (!mixer || mixer.plantId !== item.plantId) {
          throw new ValidationError(`Mixer '${item.mixerId}' not found at plant '${item.plantId}'`);
        }

        // Determine tolerance - use provided or look up default
        const tolerance = item.tolerance ?? TOLERANCE_DEFAULTS[item.materialType] ?? TOLERANCE_DEFAULTS.OTHER;

        // Calculate within tolerance
        const withinTol = isWithinTolerance(item.targetWeight, item.actualWeight, tolerance);

        const recordedAt = item.recordedAt instanceof Date ? item.recordedAt : new Date(item.recordedAt);

        const reading = await this.scaleReadingRepo.create(
          {
            plantId: item.plantId,
            mixerId: item.mixerId,
            batchNumber: item.batchNumber ?? null,
            materialType: item.materialType,
            targetWeight: item.targetWeight,
            actualWeight: item.actualWeight,
            unit: item.unit,
            tolerance,
            withinTolerance: withinTol,
            recordedAt,
          },
          trx,
        );

        results.push(reading);

        // Flag out-of-tolerance on critical materials
        if (!withinTol && CRITICAL_MATERIALS.has(item.materialType)) {
          outOfToleranceCritical.push({ reading, plantCode: plant.code });
        }

        await this.auditRepo.log(
          {
            entityType: 'ScaleReading',
            entityId: reading.id,
            action: 'CREATE',
            actor,
            changes: {
              materialType: item.materialType,
              targetWeight: item.targetWeight,
              actualWeight: item.actualWeight,
              withinTolerance: withinTol,
            },
          },
          trx,
        );
      }

      // Create outbound alerts for critical material tolerance violations
      for (const { reading, plantCode } of outOfToleranceCritical) {
        await this.outboundRepo.create(
          {
            eventType: 'TOLERANCE_VIOLATION',
            payload: {
              readingId: reading.id,
              plantId: reading.plantId,
              plantCode,
              mixerId: reading.mixerId,
              batchNumber: reading.batchNumber,
              materialType: reading.materialType,
              targetWeight: reading.targetWeight,
              actualWeight: reading.actualWeight,
              tolerance: reading.tolerance,
              unit: reading.unit,
              recordedAt: reading.recordedAt.toISOString(),
            },
            targetService: OutboundTarget.OTL_CORE,
            status: OutboundStatus.PENDING,
            attempts: 0,
            maxAttempts: 5,
            lastAttemptAt: null,
            nextRetryAt: null,
            sentAt: null,
          },
          trx,
        );
      }

      return results;
    });
  }

  async query(filters: ScaleReadingFilters): Promise<ScaleReading[]> {
    return this.scaleReadingRepo.findAll(filters);
  }
}
