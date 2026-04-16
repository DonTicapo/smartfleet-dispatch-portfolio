// --- Enums ---

export type TruckStatus = 'AVAILABLE' | 'ASSIGNED' | 'OUT_OF_SERVICE' | 'MAINTENANCE';
export type DriverStatus = 'AVAILABLE' | 'ASSIGNED' | 'OFF_DUTY' | 'SUSPENDED';
export type AssignmentStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ExceptionType = 'DELAY' | 'NO_SHOW' | 'PLANT_ISSUE' | 'ASSET_FAILURE' | 'DRIVER_ISSUE' | 'OTHER';
export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ExceptionStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

// --- Entities ---

export interface Truck {
  id: string;
  externalId: string | null;
  number: string;
  licensePlate: string | null;
  capacityAmount: number | null;
  capacityUnit: string;
  status: TruckStatus;
  homePlantId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  externalId: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  licenseNumber: string | null;
  status: DriverStatus;
  defaultTruckId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  loadId: string;
  truckId: string;
  driverId: string;
  status: AssignmentStatus;
  assignedBy: string;
  assignedAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

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
  resolvedAt: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchBoardEntry {
  id: string;
  date: string;
  loadId: string;
  orderId: string;
  ticketId: string;
  ticketNumber: string;
  customerName: string;
  siteName: string;
  mixDesignCode: string;
  requestedQuantityAmount: number | null;
  requestedQuantityUnit: string;
  loadStatus: string;
  truckId: string | null;
  truckNumber: string | null;
  driverId: string | null;
  driverName: string | null;
  assignmentId: string | null;
  assignmentStatus: string | null;
  scheduledTime: string | null;
  hasExceptions: boolean;
  lastRefreshedAt: string;
}

// --- Auth ---

export interface UserPayload {
  sub: string;
  role: string;
  email?: string;
  exp: number;
}

// --- API Request Bodies ---

export interface CreateTruckBody {
  number: string;
  externalId?: string | null;
  licensePlate?: string | null;
  capacityAmount?: number | null;
  capacityUnit?: 'M3' | 'CY';
  homePlantId?: string | null;
  notes?: string | null;
}

export interface UpdateTruckBody {
  status?: TruckStatus;
  notes?: string | null;
  licensePlate?: string | null;
}

export interface CreateDriverBody {
  firstName: string;
  lastName: string;
  externalId?: string | null;
  phone?: string | null;
  licenseNumber?: string | null;
  defaultTruckId?: string | null;
  notes?: string | null;
}

export interface UpdateDriverBody {
  status?: DriverStatus;
  notes?: string | null;
  phone?: string | null;
}

export interface CreateAssignmentBody {
  loadId: string;
  truckId: string;
  driverId: string;
  notes?: string | null;
}

export interface UpdateExceptionBody {
  status: 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolution?: string | null;
}
