// Stub for M2 — trip detail with route trace from navixy bridge.

interface Logger {
  error(obj: Record<string, unknown>, msg?: string): void;
}

export class NavixyBridgeClient {
  constructor(
    private config: { baseUrl: string; serviceToken: string },
    private _logger: Logger,
  ) {}

  async getRouteByTrip(tripId: string): Promise<Record<string, unknown>> {
    const url = `${this.config.baseUrl}/bridge/navixy/routes/by-trip`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.serviceToken}`,
      },
      body: JSON.stringify({ tripId }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Navixy bridge responded with ${response.status}`);
    return (await response.json()) as Record<string, unknown>;
  }
}
