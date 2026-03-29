import { getConfig } from '../../config.js';

export interface NavixyPosition {
  trackerId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export interface NavixyTracker {
  id: string;
  label: string;
  lastPosition: NavixyPosition | null;
}

export class NavixyBridgeClient {
  private baseUrl: string;
  private serviceToken: string;

  constructor(serviceToken: string) {
    const config = getConfig();
    this.baseUrl = config.NAVIXY_BRIDGE_BASE_URL;
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
      throw new Error(
        `Navixy Bridge request failed: ${response.status} ${response.statusText} for ${path}`,
      );
    }

    return response.json() as Promise<T>;
  }

  async getTrackerPosition(trackerId: string): Promise<NavixyPosition | null> {
    try {
      const tracker = await this.request<NavixyTracker>(
        `/trackers/${encodeURIComponent(trackerId)}`,
      );
      return tracker.lastPosition;
    } catch {
      return null;
    }
  }

  async getTrackerPositions(trackerIds: string[]): Promise<Map<string, NavixyPosition>> {
    const positions = new Map<string, NavixyPosition>();

    // Fetch positions for each tracker; in production this would be a batch endpoint
    const results = await Promise.allSettled(
      trackerIds.map(async (trackerId) => {
        const position = await this.getTrackerPosition(trackerId);
        if (position) {
          positions.set(trackerId, position);
        }
      }),
    );

    // Log failures but don't throw — partial results are acceptable
    for (const result of results) {
      if (result.status === 'rejected') {
        // Silently skip failed position fetches; caller can check which IDs returned
      }
    }

    return positions;
  }
}
