import { describe, it, expect } from 'vitest';
import { PortalUserRole } from '../../../src/domain/enums/portal-user-role.js';
import { OrderViewStatus } from '../../../src/domain/enums/order-view-status.js';
import { TicketViewStatus } from '../../../src/domain/enums/ticket-view-status.js';
import { LoadTrackerStatus } from '../../../src/domain/enums/load-tracker-status.js';
import { MessageSeverity } from '../../../src/domain/enums/message-severity.js';

describe('Domain Enums', () => {
  describe('PortalUserRole', () => {
    it('has VIEWER and ADMIN values', () => {
      expect(PortalUserRole.VIEWER).toBe('VIEWER');
      expect(PortalUserRole.ADMIN).toBe('ADMIN');
    });

    it('has exactly 2 values', () => {
      const values = Object.values(PortalUserRole);
      expect(values).toHaveLength(2);
    });
  });

  describe('OrderViewStatus', () => {
    it('has all expected values', () => {
      expect(OrderViewStatus.DRAFT).toBe('DRAFT');
      expect(OrderViewStatus.CONFIRMED).toBe('CONFIRMED');
      expect(OrderViewStatus.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(OrderViewStatus.COMPLETED).toBe('COMPLETED');
      expect(OrderViewStatus.CANCELLED).toBe('CANCELLED');
    });

    it('has exactly 5 values', () => {
      const values = Object.values(OrderViewStatus);
      expect(values).toHaveLength(5);
    });
  });

  describe('TicketViewStatus', () => {
    it('has all expected values', () => {
      expect(TicketViewStatus.CREATED).toBe('CREATED');
      expect(TicketViewStatus.SCHEDULED).toBe('SCHEDULED');
      expect(TicketViewStatus.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(TicketViewStatus.COMPLETED).toBe('COMPLETED');
      expect(TicketViewStatus.CANCELLED).toBe('CANCELLED');
    });

    it('has exactly 5 values', () => {
      const values = Object.values(TicketViewStatus);
      expect(values).toHaveLength(5);
    });
  });

  describe('LoadTrackerStatus', () => {
    it('has all expected values', () => {
      expect(LoadTrackerStatus.SCHEDULED).toBe('SCHEDULED');
      expect(LoadTrackerStatus.LOADING).toBe('LOADING');
      expect(LoadTrackerStatus.LOADED).toBe('LOADED');
      expect(LoadTrackerStatus.EN_ROUTE).toBe('EN_ROUTE');
      expect(LoadTrackerStatus.ON_SITE).toBe('ON_SITE');
      expect(LoadTrackerStatus.POURING).toBe('POURING');
      expect(LoadTrackerStatus.RETURNING).toBe('RETURNING');
      expect(LoadTrackerStatus.COMPLETED).toBe('COMPLETED');
    });

    it('has exactly 8 values', () => {
      const values = Object.values(LoadTrackerStatus);
      expect(values).toHaveLength(8);
    });
  });

  describe('MessageSeverity', () => {
    it('has all expected values', () => {
      expect(MessageSeverity.INFO).toBe('INFO');
      expect(MessageSeverity.WARNING).toBe('WARNING');
      expect(MessageSeverity.CRITICAL).toBe('CRITICAL');
    });

    it('has exactly 3 values', () => {
      const values = Object.values(MessageSeverity);
      expect(values).toHaveLength(3);
    });
  });
});
