export interface JobDto {
  id: string;
  customerId: string;
  siteId: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}
