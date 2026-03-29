import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().default('postgresql://cvp:cvp_dev@localhost:5432/cvp_portal'),
  PORT: z.coerce.number().int().positive().default(3003),
  JWT_SECRET: z.string().min(1).default('change-me-in-production'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OTL_CORE_BASE_URL: z.string().url().default('http://localhost:3000'),
  NAVIXY_BRIDGE_BASE_URL: z.string().url().default('http://localhost:3001'),
  SERVICE_JWT_SECRET: z.string().min(1).default('service-secret-change-me'),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (!_config) {
    _config = envSchema.parse(process.env);
  }
  return _config;
}
