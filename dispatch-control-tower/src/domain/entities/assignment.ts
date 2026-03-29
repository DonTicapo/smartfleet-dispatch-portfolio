import type { AssignmentStatus } from '../enums/assignment-status.js';

export interface Assignment {
  id: string;
  loadId: string;
  truckId: string;
  driverId: string;
  status: AssignmentStatus;
  assignedBy: string;
  assignedAt: Date;
  confirmedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
