import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().default('postgresql://otl:otl_dev@localhost:5432/otl_core'),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(1).default('change-me-in-production'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SERVICE_TOKEN: z.string().min(1).default('sap-sync-service'),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (!_config) {
    _config = envSchema.parse(process.env);
  }
  return _config;
}
