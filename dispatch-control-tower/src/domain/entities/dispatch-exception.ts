import type { ExceptionType } from '../enums/exception-type.js';
import type { ExceptionSeverity } from '../enums/exception-severity.js';
import type { ExceptionStatus } from '../enums/exception-status.js';

export interface DispatchException {
  id: string;
  loadId: string | null;
  assignmentId: string | null;
  truckId: string | null;
  type: ExceptionType;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  title: string;
  description: string | null;
  reportedBy: string;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
}
