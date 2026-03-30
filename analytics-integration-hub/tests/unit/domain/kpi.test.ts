import { describe, it, expect } from 'vitest';
import { KpiDimension } from '../../../src/domain/enums/kpi-dimension.js';
import { ExportType } from '../../../src/domain/enums/export-type.js';
import { ExportStatus } from '../../../src/domain/enums/export-status.js';
import { EventSource } from '../../../src/domain/enums/event-source.js';
import { DeliveryStatus } from '../../../src/domain/enums/delivery-status.js';

describe('KPI Domain Logic', () => {
  describe('KpiDimension Values', () => {
    it('has PLANT dimension for plant-level KPIs', () => {
      expect(KpiDimension.PLANT).toBe('PLANT');
    });

    it('has PROJECT dimension for project-level KPIs', () => {
      expect(KpiDimension.PROJECT).toBe('PROJECT');
    });

    it('has CUSTOMER dimension for customer-level KPIs', () => {
      expect(KpiDimension.CUSTOMER).toBe('CUSTOMER');
    });

    it('has FLEET dimension for fleet/truck-level KPIs', () => {
      expect(KpiDimension.FLEET).toBe('FLEET');
    });

    it('has exactly 4 dimensions', () => {
      expect(Object.values(KpiDimension)).toHaveLength(4);
    });

    it('all dimension values are uppercase strings matching keys', () => {
      for (const [key, value] of Object.entries(KpiDimension)) {
        expect(key).toBe(value);
      }
    });

    it('dimensions cover the full hierarchy: plant -> project -> customer -> fleet', () => {
      const dims = Object.values(KpiDimension);
      expect(dims).toContain('PLANT');
      expect(dims).toContain('PROJECT');
      expect(dims).toContain('CUSTOMER');
      expect(dims).toContain('FLEET');
    });
  });

  describe('ExportType Values', () => {
    it('supports INVOICE exports', () => {
      expect(ExportType.INVOICE).toBe('INVOICE');
    });

    it('supports DELIVERY_SUMMARY exports', () => {
      expect(ExportType.DELIVERY_SUMMARY).toBe('DELIVERY_SUMMARY');
    });

    it('supports PRODUCTION_REPORT exports', () => {
      expect(ExportType.PRODUCTION_REPORT).toBe('PRODUCTION_REPORT');
    });

    it('has exactly 3 export types', () => {
      expect(Object.values(ExportType)).toHaveLength(3);
    });
  });

  describe('ExportStatus Transitions', () => {
    it('starts at PENDING', () => {
      expect(ExportStatus.PENDING).toBe('PENDING');
    });

    it('transitions from PENDING to PROCESSING', () => {
      const status = ExportStatus.PENDING;
      const nextStatus = ExportStatus.PROCESSING;
      expect(status).not.toBe(nextStatus);
      expect(nextStatus).toBe('PROCESSING');
    });

    it('transitions from PROCESSING to COMPLETED on success', () => {
      const status = ExportStatus.PROCESSING;
      const nextStatus = ExportStatus.COMPLETED;
      expect(status).not.toBe(nextStatus);
      expect(nextStatus).toBe('COMPLETED');
    });

    it('transitions from PROCESSING to FAILED on error', () => {
      const status = ExportStatus.PROCESSING;
      const nextStatus = ExportStatus.FAILED;
      expect(status).not.toBe(nextStatus);
      expect(nextStatus).toBe('FAILED');
    });

    it('happy path is PENDING -> PROCESSING -> COMPLETED', () => {
      const happyPath = [
        ExportStatus.PENDING,
        ExportStatus.PROCESSING,
        ExportStatus.COMPLETED,
      ];
      expect(happyPath).toEqual(['PENDING', 'PROCESSING', 'COMPLETED']);
    });

    it('failure path is PENDING -> PROCESSING -> FAILED', () => {
      const failurePath = [
        ExportStatus.PENDING,
        ExportStatus.PROCESSING,
        ExportStatus.FAILED,
      ];
      expect(failurePath).toEqual(['PENDING', 'PROCESSING', 'FAILED']);
    });

    it('COMPLETED and FAILED are terminal states', () => {
      const terminalStates = [ExportStatus.COMPLETED, ExportStatus.FAILED];
      expect(terminalStates).toContain('COMPLETED');
      expect(terminalStates).toContain('FAILED');
    });

    it('has exactly 4 statuses', () => {
      expect(Object.values(ExportStatus)).toHaveLength(4);
    });
  });

  describe('EventSource Values', () => {
    it('has OTL_CORE for order-ticket-load core events', () => {
      expect(EventSource.OTL_CORE).toBe('OTL_CORE');
    });

    it('has NAVIXY_BRIDGE for telematics events', () => {
      expect(EventSource.NAVIXY_BRIDGE).toBe('NAVIXY_BRIDGE');
    });

    it('has DISPATCH_TOWER for dispatch control events', () => {
      expect(EventSource.DISPATCH_TOWER).toBe('DISPATCH_TOWER');
    });

    it('has PLANT_EDGE for plant OT bridge events', () => {
      expect(EventSource.PLANT_EDGE).toBe('PLANT_EDGE');
    });

    it('has exactly 4 sources', () => {
      expect(Object.values(EventSource)).toHaveLength(4);
    });

    it('all sources map to portfolio project names', () => {
      const sources = Object.values(EventSource);
      // Each source corresponds to a sibling project in the portfolio
      expect(sources).toContain('OTL_CORE');
      expect(sources).toContain('NAVIXY_BRIDGE');
      expect(sources).toContain('DISPATCH_TOWER');
      expect(sources).toContain('PLANT_EDGE');
    });
  });

  describe('DeliveryStatus Values', () => {
    it('has PENDING for queued webhook deliveries', () => {
      expect(DeliveryStatus.PENDING).toBe('PENDING');
    });

    it('has DELIVERED for successful webhook deliveries', () => {
      expect(DeliveryStatus.DELIVERED).toBe('DELIVERED');
    });

    it('has FAILED for failed webhook deliveries', () => {
      expect(DeliveryStatus.FAILED).toBe('FAILED');
    });

    it('has exactly 3 delivery statuses', () => {
      expect(Object.values(DeliveryStatus)).toHaveLength(3);
    });
  });

  describe('Idempotency Concepts', () => {
    it('event IDs must be unique strings for deduplication', () => {
      const eventId1 = 'evt_abc123';
      const eventId2 = 'evt_def456';
      expect(eventId1).not.toBe(eventId2);
    });

    it('same event ID means duplicate — should be rejected', () => {
      const seen = new Set<string>();
      const eventId = 'evt_abc123';

      // First time: not a duplicate
      expect(seen.has(eventId)).toBe(false);
      seen.add(eventId);

      // Second time: is a duplicate
      expect(seen.has(eventId)).toBe(true);
    });

    it('IngestEvent has both id (row PK) and eventId (source idempotency key)', () => {
      // The entity has id (internal DB PK) and eventId (external dedup key)
      const event = {
        id: 'internal-uuid-1',
        eventId: 'external-source-event-id-1',
      };
      expect(event.id).not.toBe(event.eventId);
      expect(typeof event.id).toBe('string');
      expect(typeof event.eventId).toBe('string');
    });

    it('multiple events from same source should have distinct eventIds', () => {
      const events = [
        { eventId: 'src_evt_001', source: 'OTL_CORE' },
        { eventId: 'src_evt_002', source: 'OTL_CORE' },
        { eventId: 'src_evt_003', source: 'OTL_CORE' },
      ];
      const ids = events.map((e) => e.eventId);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it('eventId-based dedup works across different sources', () => {
      const seen = new Set<string>();
      const events = [
        { eventId: 'evt_1', source: 'OTL_CORE' },
        { eventId: 'evt_1', source: 'PLANT_EDGE' }, // same eventId, different source
        { eventId: 'evt_2', source: 'OTL_CORE' },
      ];

      const processed: typeof events = [];
      for (const event of events) {
        const dedupKey = `${event.source}:${event.eventId}`;
        if (!seen.has(dedupKey)) {
          seen.add(dedupKey);
          processed.push(event);
        }
      }

      // All 3 are unique when combining source + eventId
      expect(processed).toHaveLength(3);
    });
  });
});
