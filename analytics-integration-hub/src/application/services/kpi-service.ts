import type { Knex } from 'knex';
import type { KpiDefinition } from '../../domain/entities/kpi-definition.js';
import type { KpiSnapshot } from '../../domain/entities/kpi-snapshot.js';
import { KpiDimension } from '../../domain/enums/kpi-dimension.js';
import { DuplicateEntityError, ValidationError } from '../../domain/errors/domain-error.js';
import type { KpiDefinitionRepository } from '../../infrastructure/repositories/kpi-definition-repository.js';
import type { KpiSnapshotRepository, KpiSnapshotFilters } from '../../infrastructure/repositories/kpi-snapshot-repository.js';
import type { IngestEventRepository } from '../../infrastructure/repositories/ingest-event-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';
import type { IngestEvent } from '../../domain/entities/ingest-event.js';

export interface CreateKpiDefinitionInput {
  name: string;
  displayName: string;
  description: string;
  unit: string;
  dimension: KpiDimension;
  formula: string;
  isActive?: boolean;
}

export interface ComputeKpiInput {
  periodStart: Date;
  periodEnd: Date;
  dimension: KpiDimension;
  dimensionId?: string;
}

export class KpiService {
  constructor(
    private db: Knex,
    private definitionRepo: KpiDefinitionRepository,
    private snapshotRepo: KpiSnapshotRepository,
    private eventRepo: IngestEventRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async createDefinition(input: CreateKpiDefinitionInput, actor: string): Promise<KpiDefinition> {
    return this.db.transaction(async (trx) => {
      const existing = await this.definitionRepo.findByName(input.name);
      if (existing) {
        throw new DuplicateEntityError('KpiDefinition', 'name', input.name);
      }

      const definition = await this.definitionRepo.create(
        {
          name: input.name,
          displayName: input.displayName,
          description: input.description,
          unit: input.unit,
          dimension: input.dimension,
          formula: input.formula,
          isActive: input.isActive ?? true,
        },
        trx,
      );

      await this.auditRepo.log(
        {
          entityType: 'KpiDefinition',
          entityId: definition.id,
          action: 'CREATE',
          actor,
          changes: { name: input.name, dimension: input.dimension },
        },
        trx,
      );

      return definition;
    });
  }

  async listDefinitions(): Promise<KpiDefinition[]> {
    return this.definitionRepo.listAll();
  }

  async querySnapshots(filters: KpiSnapshotFilters): Promise<KpiSnapshot[]> {
    return this.snapshotRepo.query(filters);
  }

  async computeKpis(input: ComputeKpiInput, actor: string): Promise<KpiSnapshot[]> {
    if (input.periodStart >= input.periodEnd) {
      throw new ValidationError('periodStart must be before periodEnd');
    }

    return this.db.transaction(async (trx) => {
      // Fetch all delivery-lifecycle events in the period
      const deliveryEventTypes = [
        'load.status_changed',
        'load.created',
        'load.completed',
        'delivery.plant_departed',
        'delivery.arrived_site',
        'delivery.pour_started',
        'delivery.pour_completed',
        'delivery.plant_returned',
      ];

      const events = await this.eventRepo.queryForKpiComputation(
        deliveryEventTypes,
        input.periodStart,
        input.periodEnd,
      );

      const snapshots: Omit<KpiSnapshot, 'id' | 'createdAt'>[] = [];
      const now = new Date();

      // Compute each KPI
      const loadsPerDay = this.computeLoadsPerDay(events, input, now);
      snapshots.push(...loadsPerDay);

      const avgDeliveryTime = this.computeAvgDeliveryTime(events, input, now);
      snapshots.push(...avgDeliveryTime);

      const totalVolume = this.computeTotalVolumeDelivered(events, input, now);
      snapshots.push(...totalVolume);

      const onTimeRate = this.computeOnTimeDeliveryRate(events, input, now);
      snapshots.push(...onTimeRate);

      const truckUtilization = this.computeTruckUtilizationRate(events, input, now);
      snapshots.push(...truckUtilization);

      // Persist snapshots
      const created = await this.snapshotRepo.createMany(snapshots, trx);

      await this.auditRepo.log(
        {
          entityType: 'KpiSnapshot',
          entityId: 'batch',
          action: 'COMPUTE',
          actor,
          changes: {
            periodStart: input.periodStart.toISOString(),
            periodEnd: input.periodEnd.toISOString(),
            dimension: input.dimension,
            snapshotsCreated: created.length,
          },
        },
        trx,
      );

      return created;
    });
  }

  async getPlantDashboard(): Promise<KpiSnapshot[]> {
    return this.snapshotRepo.queryByDimension(KpiDimension.PLANT);
  }

  async getDispatchDashboard(): Promise<KpiSnapshot[]> {
    return this.snapshotRepo.queryByDimension(KpiDimension.FLEET);
  }

  // --- KPI Computation Methods ---

  private computeLoadsPerDay(
    events: IngestEvent[],
    input: ComputeKpiInput,
    now: Date,
  ): Omit<KpiSnapshot, 'id' | 'createdAt'>[] {
    // Count completed loads per plant per day
    const completedLoads = events.filter(
      (e) => e.eventType === 'load.completed' || e.eventType === 'delivery.plant_returned',
    );

    // Group by plant (from payload.plantId or aggregateId)
    const byPlant = new Map<string, number>();
    for (const event of completedLoads) {
      const plantId = (event.payload.plantId as string) || event.aggregateId;
      if (input.dimensionId && plantId !== input.dimensionId) continue;
      byPlant.set(plantId, (byPlant.get(plantId) || 0) + 1);
    }

    // Calculate period duration in days
    const periodDays = Math.max(
      1,
      (input.periodEnd.getTime() - input.periodStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Array.from(byPlant.entries()).map(([plantId, count]) => ({
      kpiName: 'loads_per_day',
      dimension: input.dimension,
      dimensionId: plantId,
      value: Math.round((count / periodDays) * 10000) / 10000,
      unit: 'loads/day',
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      computedAt: now,
    }));
  }

  private computeAvgDeliveryTime(
    events: IngestEvent[],
    input: ComputeKpiInput,
    now: Date,
  ): Omit<KpiSnapshot, 'id' | 'createdAt'>[] {
    // Average time from departed_plant to arrived_site
    const departures = new Map<string, Date>();
    const arrivals = new Map<string, Date>();

    for (const event of events) {
      const loadId = (event.payload.loadId as string) || event.aggregateId;
      if (event.eventType === 'delivery.plant_departed') {
        departures.set(loadId, event.occurredAt);
      } else if (event.eventType === 'delivery.arrived_site') {
        arrivals.set(loadId, event.occurredAt);
      }
    }

    // Group by dimension
    const timesPerDimension = new Map<string, number[]>();
    for (const [loadId, departedAt] of departures.entries()) {
      const arrivedAt = arrivals.get(loadId);
      if (!arrivedAt) continue;

      const diffMinutes = (arrivedAt.getTime() - departedAt.getTime()) / (1000 * 60);
      if (diffMinutes < 0) continue;

      // Find dimension id from the events
      const relatedEvent = events.find(
        (e) => ((e.payload.loadId as string) || e.aggregateId) === loadId,
      );
      const dimId = this.extractDimensionId(relatedEvent, input.dimension);
      if (input.dimensionId && dimId !== input.dimensionId) continue;

      const times = timesPerDimension.get(dimId) || [];
      times.push(diffMinutes);
      timesPerDimension.set(dimId, times);
    }

    return Array.from(timesPerDimension.entries()).map(([dimId, times]) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      return {
        kpiName: 'avg_delivery_time_minutes',
        dimension: input.dimension,
        dimensionId: dimId,
        value: Math.round(avg * 10000) / 10000,
        unit: 'minutes',
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        computedAt: now,
      };
    });
  }

  private computeTotalVolumeDelivered(
    events: IngestEvent[],
    input: ComputeKpiInput,
    now: Date,
  ): Omit<KpiSnapshot, 'id' | 'createdAt'>[] {
    // Sum of load quantities per project
    const completedLoads = events.filter(
      (e) => e.eventType === 'load.completed' || e.eventType === 'delivery.plant_returned',
    );

    const volumeByDimension = new Map<string, number>();
    for (const event of completedLoads) {
      const dimId = this.extractDimensionId(event, input.dimension);
      if (input.dimensionId && dimId !== input.dimensionId) continue;

      const quantity = (event.payload.quantity as number) || (event.payload.actualQuantityAmount as number) || 0;
      volumeByDimension.set(dimId, (volumeByDimension.get(dimId) || 0) + quantity);
    }

    return Array.from(volumeByDimension.entries()).map(([dimId, volume]) => ({
      kpiName: 'total_volume_delivered',
      dimension: input.dimension,
      dimensionId: dimId,
      value: Math.round(volume * 10000) / 10000,
      unit: 'CY',
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      computedAt: now,
    }));
  }

  private computeOnTimeDeliveryRate(
    events: IngestEvent[],
    input: ComputeKpiInput,
    now: Date,
  ): Omit<KpiSnapshot, 'id' | 'createdAt'>[] {
    // Percentage of loads arriving within requested time window
    const arrivals = events.filter((e) => e.eventType === 'delivery.arrived_site');

    const statsByDimension = new Map<string, { total: number; onTime: number }>();

    for (const event of arrivals) {
      const dimId = this.extractDimensionId(event, input.dimension);
      if (input.dimensionId && dimId !== input.dimensionId) continue;

      const stats = statsByDimension.get(dimId) || { total: 0, onTime: 0 };
      stats.total++;

      const requestedTime = event.payload.requestedDeliveryTime as string | undefined;
      if (requestedTime) {
        const requested = new Date(requestedTime);
        if (event.occurredAt <= requested) {
          stats.onTime++;
        }
      } else {
        // If no requested time, consider on-time by default
        stats.onTime++;
      }

      statsByDimension.set(dimId, stats);
    }

    return Array.from(statsByDimension.entries()).map(([dimId, stats]) => ({
      kpiName: 'on_time_delivery_rate',
      dimension: input.dimension,
      dimensionId: dimId,
      value: stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100 * 10000) / 10000 : 0,
      unit: 'percent',
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      computedAt: now,
    }));
  }

  private computeTruckUtilizationRate(
    events: IngestEvent[],
    input: ComputeKpiInput,
    now: Date,
  ): Omit<KpiSnapshot, 'id' | 'createdAt'>[] {
    // Percentage of time trucks are actively delivering vs idle
    // Active = time between plant_departed and plant_returned
    // Total = period duration

    const departuresByTruck = new Map<string, Date[]>();
    const returnsByTruck = new Map<string, Date[]>();

    for (const event of events) {
      const truckId = (event.payload.truckId as string) || null;
      if (!truckId) continue;

      if (event.eventType === 'delivery.plant_departed') {
        const departures = departuresByTruck.get(truckId) || [];
        departures.push(event.occurredAt);
        departuresByTruck.set(truckId, departures);
      } else if (event.eventType === 'delivery.plant_returned') {
        const returns = returnsByTruck.get(truckId) || [];
        returns.push(event.occurredAt);
        returnsByTruck.set(truckId, returns);
      }
    }

    const periodMs = input.periodEnd.getTime() - input.periodStart.getTime();
    if (periodMs <= 0) return [];

    const snapshots: Omit<KpiSnapshot, 'id' | 'createdAt'>[] = [];

    for (const [truckId, departures] of departuresByTruck.entries()) {
      if (input.dimensionId && truckId !== input.dimensionId) continue;

      const returns = returnsByTruck.get(truckId) || [];
      let activeMs = 0;

      // Match departures to returns sequentially
      const sortedDepartures = [...departures].sort((a, b) => a.getTime() - b.getTime());
      const sortedReturns = [...returns].sort((a, b) => a.getTime() - b.getTime());

      let returnIdx = 0;
      for (const dep of sortedDepartures) {
        // Find next return after this departure
        while (returnIdx < sortedReturns.length && sortedReturns[returnIdx].getTime() <= dep.getTime()) {
          returnIdx++;
        }
        if (returnIdx < sortedReturns.length) {
          activeMs += sortedReturns[returnIdx].getTime() - dep.getTime();
          returnIdx++;
        }
      }

      const utilization = (activeMs / periodMs) * 100;

      snapshots.push({
        kpiName: 'truck_utilization_rate',
        dimension: KpiDimension.FLEET,
        dimensionId: truckId,
        value: Math.round(utilization * 10000) / 10000,
        unit: 'percent',
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        computedAt: now,
      });
    }

    return snapshots;
  }

  private extractDimensionId(event: IngestEvent | undefined, dimension: KpiDimension): string {
    if (!event) return 'unknown';

    switch (dimension) {
      case KpiDimension.PLANT:
        return (event.payload.plantId as string) || event.aggregateId;
      case KpiDimension.PROJECT:
        return (event.payload.projectId as string) || (event.payload.jobId as string) || event.aggregateId;
      case KpiDimension.CUSTOMER:
        return (event.payload.customerId as string) || event.aggregateId;
      case KpiDimension.FLEET:
        return (event.payload.truckId as string) || event.aggregateId;
      default:
        return event.aggregateId;
    }
  }
}
