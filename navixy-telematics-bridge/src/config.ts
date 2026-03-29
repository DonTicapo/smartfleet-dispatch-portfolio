import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('postgresql://ntb:ntb_dev@localhost:5433/ntb_bridge'),
  PORT: z.coerce.number().int().positive().default(3001),
  JWT_SECRET: z.string().min(1).default('change-me-in-production'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  NAVIXY_API_URL: z.string().url().default('https://api.navixy.com/v2'),
  NAVIXY_USER_HASH: z.string().min(1).default('change-me'),

  OTL_CORE_URL: z.string().url().default('http://localhost:3000'),
  OTL_SERVICE_TOKEN: z.string().min(1).default('change-me'),

  OUTBOUND_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
  OUTBOUND_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (!_config) {
    _config = envSchema.parse(process.env);
  }
  return _config;
}
