export type OrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type TicketStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type LoadStatus =
  | 'SCHEDULED'
  | 'LOADING'
  | 'LOADED'
  | 'EN_ROUTE'
  | 'ON_SITE'
  | 'POURING'
  | 'RETURNING'
  | 'COMPLETED';

export type MessageSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Order {
  id: string;
  jobName: string;
  siteName: string;
  mixDesign: string;
  quantityOrdered: number;
  quantityUnit: string;
  deliveryDate: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  orderId: string;
  ticketNumber: string;
  status: TicketStatus;
  scheduledDate: string;
  quantityRequested: number;
  quantityUnit: string;
  createdAt: string;
  updatedAt: string;
}

export interface Load {
  id: string;
  ticketId: string;
  truckId: string;
  driverName: string;
  driverPhone: string;
  status: LoadStatus;
  currentLat: number | null;
  currentLon: number | null;
  etaMinutes: number | null;
  departedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  subject: string;
  body: string;
  severity: MessageSeverity;
  isRead: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
}

export interface UserPayload {
  sub: string;
  email: string;
  customerId: string;
  companyName: string;
  exp: number;
}
