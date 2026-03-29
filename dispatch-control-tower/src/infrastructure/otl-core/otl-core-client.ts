interface Logger {
  error(obj: Record<string, unknown>, msg?: string): void;
}

export class OtlCoreClient {
  constructor(
    private config: { baseUrl: string; serviceToken: string },
    private logger: Logger,
  ) {}

  private get headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.serviceToken}`,
    };
  }

  async listTicketsByDate(date: string): Promise<Record<string, unknown>[]> {
    // In production, OTL core would expose a query endpoint.
    // For now, this is a stub that returns an empty array.
    // The dispatcher UI will populate the board via refresh.
    const url = `${this.config.baseUrl}/tickets?scheduledDate=${date}`;
    try {
      const response = await fetch(url, { headers: this.headers, signal: AbortSignal.timeout(10000) });
      if (!response.ok) return [];
      return (await response.json()) as Record<string, unknown>[];
    } catch {
      return [];
    }
  }

  async updateLoadAssignment(loadId: string, truckId: string, driverId: string): Promise<Record<string, unknown>> {
    const url = `${this.config.baseUrl}/loads/${loadId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({ truckId, driverId }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const text = await response.text();
      this.logger.error({ status: response.status, body: text }, 'OTL core load assignment update failed');
      throw new Error(`OTL core responded with ${response.status}: ${text}`);
    }
    return (await response.json()) as Record<string, unknown>;
  }
}
