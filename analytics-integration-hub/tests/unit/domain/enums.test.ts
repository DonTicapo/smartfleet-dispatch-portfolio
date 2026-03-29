import { describe, it, expect } from 'vitest';
import { EventSource } from '../../../src/domain/enums/event-source.js';
import { KpiDimension } from '../../../src/domain/enums/kpi-dimension.js';
import { ExportType } from '../../../src/domain/enums/export-type.js';
import { ExportStatus } from '../../../src/domain/enums/export-status.js';
import { DeliveryStatus } from '../../../src/domain/enums/delivery-status.js';
import {
  DomainError,
  EntityNotFoundError,
  InvalidTransitionError,
  ValidationError,
  DuplicateEntityError,
} from '../../../src/domain/errors/domain-error.js';

describe('Domain Enums', () => {
  describe('EventSource', () => {
    it('has all expected values', () => {
      expect(EventSource.OTL_CORE).toBe('OTL_CORE');
      expect(EventSource.NAVIXY_BRIDGE).toBe('NAVIXY_BRIDGE');
      expect(EventSource.DISPATCH_TOWER).toBe('DISPATCH_TOWER');
      expect(EventSource.PLANT_EDGE).toBe('PLANT_EDGE');
    });

    it('has exactly 4 members', () => {
      const values = Object.values(EventSource);
      expect(values).toHaveLength(4);
    });
  });

  describe('KpiDimension', () => {
    it('has all expected values', () => {
      expect(KpiDimension.PLANT).toBe('PLANT');
      expect(KpiDimension.PROJECT).toBe('PROJECT');
      expect(KpiDimension.CUSTOMER).toBe('CUSTOMER');
      expect(KpiDimension.FLEET).toBe('FLEET');
    });

    it('has exactly 4 members', () => {
      const values = Object.values(KpiDimension);
      expect(values).toHaveLength(4);
    });
  });

  describe('ExportType', () => {
    it('has all expected values', () => {
      expect(ExportType.INVOICE).toBe('INVOICE');
      expect(ExportType.DELIVERY_SUMMARY).toBe('DELIVERY_SUMMARY');
      expect(ExportType.PRODUCTION_REPORT).toBe('PRODUCTION_REPORT');
    });

    it('has exactly 3 members', () => {
      const values = Object.values(ExportType);
      expect(values).toHaveLength(3);
    });
  });

  describe('ExportStatus', () => {
    it('has all expected values', () => {
      expect(ExportStatus.PENDING).toBe('PENDING');
      expect(ExportStatus.PROCESSING).toBe('PROCESSING');
      expect(ExportStatus.COMPLETED).toBe('COMPLETED');
      expect(ExportStatus.FAILED).toBe('FAILED');
    });

    it('has exactly 4 members', () => {
      const values = Object.values(ExportStatus);
      expect(values).toHaveLength(4);
    });
  });

  describe('DeliveryStatus', () => {
    it('has all expected values', () => {
      expect(DeliveryStatus.PENDING).toBe('PENDING');
      expect(DeliveryStatus.DELIVERED).toBe('DELIVERED');
      expect(DeliveryStatus.FAILED).toBe('FAILED');
    });

    it('has exactly 3 members', () => {
      const values = Object.values(DeliveryStatus);
      expect(values).toHaveLength(3);
    });
  });
});

describe('Domain Errors', () => {
  describe('DomainError', () => {
    it('creates with code and message', () => {
      const error = new DomainError('TEST_CODE', 'test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('test message');
      expect(error.name).toBe('DomainError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('EntityNotFoundError', () => {
    it('creates with entity type and id', () => {
      const error = new EntityNotFoundError('IngestEvent', 'abc-123');
      expect(error.code).toBe('ENTITY_NOT_FOUND');
      expect(error.message).toBe("IngestEvent with id 'abc-123' not found");
      expect(error.name).toBe('EntityNotFoundError');
      expect(error).toBeInstanceOf(DomainError);
    });
  });

  describe('InvalidTransitionError', () => {
    it('creates with entity type, id, and states', () => {
      const error = new InvalidTransitionError('ExportJob', 'job-1', 'PENDING', 'COMPLETED');
      expect(error.code).toBe('INVALID_TRANSITION');
      expect(error.message).toContain('PENDING');
      expect(error.message).toContain('COMPLETED');
      expect(error.name).toBe('InvalidTransitionError');
    });
  });

  describe('ValidationError', () => {
    it('creates with message', () => {
      const error = new ValidationError('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('DuplicateEntityError', () => {
    it('creates with entity type, field, and value', () => {
      const error = new DuplicateEntityError('KpiDefinition', 'name', 'loads_per_day');
      expect(error.code).toBe('DUPLICATE_ENTITY');
      expect(error.message).toContain('loads_per_day');
      expect(error.name).toBe('DuplicateEntityError');
    });
  });
});
