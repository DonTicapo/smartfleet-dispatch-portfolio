interface Logger {
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}
import type {
  NavixyTrackerRaw,
  NavixyTripRaw,
  NavixyRoutePointRaw,
  NavixyGeofenceRaw,
  NavixyApiResponse,
} from './navixy-types.js';
import { NavixyApiError, NavixyAuthError } from '../../domain/errors/domain-error.js';

interface NavixyClientConfig {
  apiUrl: string;
  userHash: string;
}

export class NavixyClient {
  private hash: string;

  constructor(
    private config: NavixyClientConfig,
    private logger: Logger,
  ) {
    this.hash = config.userHash;
  }

  async listTrackers(): Promise<NavixyTrackerRaw[]> {
    const data = await this.request<NavixyApiResponse<NavixyTrackerRaw>>('tracker/list', {});
    return data.list ?? [];
  }

  async listTrips(trackerId: number, from: Date, to: Date): Promise<NavixyTripRaw[]> {
    const data = await this.request<NavixyApiResponse<NavixyTripRaw>>('track/list', {
      tracker_id: trackerId,
      from: from.toISOString().replace('T', ' ').slice(0, 19),
      to: to.toISOString().replace('T', ' ').slice(0, 19),
    });
    return data.list ?? [];
  }

  async getRoute(trackerId: number, from: Date, to: Date): Promise<NavixyRoutePointRaw[]> {
    const data = await this.request<NavixyApiResponse<NavixyRoutePointRaw> & { list?: NavixyRoutePointRaw[] }>(
      'track/read',
      {
        tracker_id: trackerId,
        from: from.toISOString().replace('T', ' ').slice(0, 19),
        to: to.toISOString().replace('T', ' ').slice(0, 19),
      },
    );
    return data.list ?? [];
  }

  async listGeofences(): Promise<NavixyGeofenceRaw[]> {
    const data = await this.request<NavixyApiResponse<NavixyGeofenceRaw>>('zone/list', {});
    return data.list ?? [];
  }

  private async request<T>(method: string, params: Record<string, unknown>): Promise<T> {
    const url = `${this.config.apiUrl}/${method}`;
    const body = { hash: this.hash, ...params };

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000),
        });

        if (response.status === 429) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.warn({ method, attempt, delay }, 'Navixy rate limited, retrying');
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        const data = (await response.json()) as T & { success?: boolean; status?: { code: number; description: string } };

        if (data.success === false) {
          const status = data.status;
          if (status?.code === 4) {
            throw new NavixyAuthError(`Navixy auth failed: ${status.description}`);
          }
          throw new NavixyApiError(status?.code ?? null, `Navixy error: ${status?.description ?? 'unknown'}`);
        }

        return data;
      } catch (err) {
        if (err instanceof NavixyAuthError) throw err;
        lastError = err as Error;
        if (attempt < 2) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.warn({ method, attempt, error: (err as Error).message }, 'Navixy request failed, retrying');
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError ?? new NavixyApiError(null, 'Navixy request failed after retries');
  }
}
