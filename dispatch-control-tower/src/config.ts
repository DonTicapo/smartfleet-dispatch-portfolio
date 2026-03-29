import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('postgresql://dct:dct_dev@localhost:5434/dct_tower'),
  PORT: z.coerce.number().int().positive().default(3002),
  JWT_SECRET: z.string().min(1).default('change-me-in-production'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OTL_CORE_URL: z.string().url().default('http://localhost:3000'),
  OTL_SERVICE_TOKEN: z.string().min(1).default('change-me'),
  NAVIXY_BRIDGE_URL: z.string().url().default('http://localhost:3001'),
  NAVIXY_BRIDGE_TOKEN: z.string().min(1).default('change-me'),
  BOARD_REFRESH_INTERVAL_MS: z.coerce.number().int().positive().default(30000),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (!_config) {
    _config = envSchema.parse(process.env);
  }
  return _config;
}
