export interface Job {
  id: string;
  customerId: string;
  siteId: string;
  name: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
