import { getConfig } from '../../config.js';

export interface OtlOrder {
  id: string;
  externalId: string | null;
  customerId: string;
  jobId: string;
  mixDesignId: string;
  requestedQuantity: { amount: number; unit: string };
  requestedDeliveryDate: string;
  status: string;
}

export interface OtlTicket {
  id: string;
  orderId: string;
  ticketNumber: string;
  status: string;
  scheduledDate: string;
  plantId: string | null;
}

export interface OtlLoad {
  id: string;
  ticketId: string;
  loadNumber: number;
  truckId: string | null;
  driverId: string | null;
  status: string;
}

export interface OtlJob {
  id: string;
  customerId: string;
  siteId: string;
  name: string;
}

export interface OtlSite {
  id: string;
  name: string;
}

export interface OtlMixDesign {
  id: string;
  name: string;
}

export class OtlCoreClient {
  private baseUrl: string;
  private serviceToken: string;

  constructor(serviceToken: string) {
    const config = getConfig();
    this.baseUrl = config.OTL_CORE_BASE_URL;
    this.serviceToken = serviceToken;
  }

  private async request<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.serviceToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OTL Core request failed: ${response.status} ${response.statusText} for ${path}`);
    }

    return response.json() as Promise<T>;
  }

  async getOrdersByCustomer(customerId: string): Promise<OtlOrder[]> {
    return this.request<OtlOrder[]>(`/orders?customerId=${encodeURIComponent(customerId)}`);
  }

  async getOrder(orderId: string): Promise<OtlOrder> {
    return this.request<OtlOrder>(`/orders/${encodeURIComponent(orderId)}`);
  }

  async getTicketsByOrder(orderId: string): Promise<OtlTicket[]> {
    return this.request<OtlTicket[]>(`/tickets?orderId=${encodeURIComponent(orderId)}`);
  }

  async getTicket(ticketId: string): Promise<OtlTicket> {
    return this.request<OtlTicket>(`/tickets/${encodeURIComponent(ticketId)}`);
  }

  async getLoadsByTicket(ticketId: string): Promise<OtlLoad[]> {
    return this.request<OtlLoad[]>(`/loads?ticketId=${encodeURIComponent(ticketId)}`);
  }

  async getLoad(loadId: string): Promise<OtlLoad> {
    return this.request<OtlLoad>(`/loads/${encodeURIComponent(loadId)}`);
  }

  async getJob(jobId: string): Promise<OtlJob> {
    return this.request<OtlJob>(`/jobs/${encodeURIComponent(jobId)}`);
  }

  async getSite(siteId: string): Promise<OtlSite> {
    return this.request<OtlSite>(`/sites/${encodeURIComponent(siteId)}`);
  }

  async getMixDesign(mixDesignId: string): Promise<OtlMixDesign> {
    return this.request<OtlMixDesign>(`/mix-designs/${encodeURIComponent(mixDesignId)}`);
  }
}
