import type { Knex } from 'knex';
import type { GeofenceEvent } from '../../domain/entities/geofence-event.js';
import type { GeofenceTransition } from '../../domain/enums/geofence-transition.js';
import { inferDeliveryState } from '../../domain/state-machines/geofence-inference.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { TrackerAssetRepository } from '../../infrastructure/repositories/tracker-asset-repository.js';
import type { GeofenceZoneRepository } from '../../infrastructure/repositories/geofence-zone-repository.js';
import type { GeofenceEventRepository } from '../../infrastructure/repositories/geofence-event-repository.js';
import type { OutboundEventRepository } from '../../infrastructure/repositories/outbound-event-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';
import type { Config } from '../../config.js';

export interface RecordGeofenceEventInput {
  trackerAssetId: string;
  geofenceZoneId: string;
  transition: GeofenceTransition;
  latitude: number;
  longitude: number;
  occurredAt: Date;
  navixyEventId?: string | null;
}

export interface GeofenceEventResult {
  event: GeofenceEvent;
  isNew: boolean;
  deliveryStateInferred: string | null;
  outboundQueued: boolean;
}

export class GeofenceEventService {
  constructor(
    private db: Knex,
    private assetRepo: TrackerAssetRepository,
    private zoneRepo: GeofenceZoneRepository,
    private eventRepo: GeofenceEventRepository,
    private outboundRepo: OutboundEventRepository,
    private auditRepo: AuditLogRepository,
    private config: Config,
  ) {}

  async record(input: RecordGeofenceEventInput, actor: string): Promise<GeofenceEventResult> {
    return this.db.transaction(async (trx) => {
      // Verify references exist
      const asset = await this.assetRepo.findById(input.trackerAssetId);
      if (!asset) throw new EntityNotFoundError('TrackerAsset', input.trackerAssetId);

      const zone = await this.zoneRepo.findById(input.geofenceZoneId);
      if (!zone) throw new EntityNotFoundError('GeofenceZone', input.geofenceZoneId);

      // Insert event idempotently
      const { event, isNew } = await this.eventRepo.insertIdempotent(
        {
          tracker_asset_id: input.trackerAssetId,
          geofence_zone_id: input.geofenceZoneId,
          transition: input.transition,
          latitude: input.latitude,
          longitude: input.longitude,
          occurred_at: input.occurredAt,
          navixy_event_id: input.navixyEventId ?? null,
        },
        trx,
      );

      if (!isNew) {
        return { event, isNew: false, deliveryStateInferred: null, outboundQueued: false };
      }

      // Run inference engine
      const inference = inferDeliveryState({
        zoneType: zone.zoneType,
        transition: input.transition,
      });

      let outboundQueued = false;

      if (inference.deliveryState && asset.truckId) {
        // Queue outbound event for OTL core
        await this.outboundRepo.create(
          {
            event_type: 'DELIVERY_STATE',
            target_url: `${this.config.OTL_CORE_URL}/events/delivery-state`,
            payload: JSON.stringify({
              eventId: `ntb-${event.id}`,
              loadId: '', // resolved by outbound dispatcher or OTL core
              state: inference.deliveryState,
              occurredAt: input.occurredAt.toISOString(),
              source: 'navixy-bridge',
              sourceEventId: input.navixyEventId ?? event.id,
              payload: {
                trackerAssetId: asset.id,
                truckId: asset.truckId,
                geofenceZoneId: zone.id,
                zoneType: zone.zoneType,
                transition: input.transition,
                latitude: input.latitude,
                longitude: input.longitude,
              },
            }),
            status: 'PENDING',
            attempts: 0,
          },
          trx,
        );
        outboundQueued = true;
      }

      await this.eventRepo.markProcessed(event.id, trx);

      await this.auditRepo.log(
        {
          entityType: 'GeofenceEvent',
          entityId: event.id,
          action: 'RECORD',
          actor,
          changes: {
            inference: inference.reason,
            outboundQueued,
          },
        },
        trx,
      );

      return {
        event,
        isNew: true,
        deliveryStateInferred: inference.deliveryState,
        outboundQueued,
      };
    });
  }
}
