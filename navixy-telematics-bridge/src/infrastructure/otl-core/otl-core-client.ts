interface Logger {
  error(obj: Record<string, unknown>, msg?: string): void;
}

export interface DeliveryEventPayload {
  eventId: string;
  loadId: string;
  state: string;
  occurredAt: string;
  source: string;
  sourceEventId?: string | null;
  payload?: Record<string, unknown> | null;
}

export interface DeliveryEventResponse {
  event: Record<string, unknown>;
  isNew: boolean;
  loadStatusChanged: boolean;
}

export class OtlCoreClient {
  constructor(
    private config: { baseUrl: string; serviceToken: string },
    private logger: Logger,
  ) {}

  async recordDeliveryEvent(event: DeliveryEventPayload): Promise<DeliveryEventResponse> {
    const url = `${this.config.baseUrl}/events/delivery-state`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.serviceToken}`,
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error({ status: response.status, body: text }, 'OTL core delivery event failed');
      throw new Error(`OTL core responded with ${response.status}: ${text}`);
    }

    return (await response.json()) as DeliveryEventResponse;
  }
}
