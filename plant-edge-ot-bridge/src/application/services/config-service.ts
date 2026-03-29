import { TOLERANCE_DEFAULTS } from '../../domain/value-objects/tolerance-defaults.js';

export interface EdgeConfig {
  pollIntervalMs: number;
  outboundRetryMaxAttempts: number;
  outboundFlushIntervalMs: number;
  heartbeatIntervalMs: number;
  toleranceDefaults: Record<string, number>;
}

export class ConfigService {
  getConfig(): EdgeConfig {
    return {
      pollIntervalMs: 5000,
      outboundRetryMaxAttempts: 5,
      outboundFlushIntervalMs: 10000,
      heartbeatIntervalMs: 60000,
      toleranceDefaults: { ...TOLERANCE_DEFAULTS },
    };
  }
}
