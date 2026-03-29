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
  lastRefreshedAt: Date;
}
