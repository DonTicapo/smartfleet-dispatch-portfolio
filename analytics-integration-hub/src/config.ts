import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().default('postgresql://aih:aih_dev@localhost:5432/aih_hub'),
  PORT: z.coerce.number().int().positive().default(3004),
  JWT_SECRET: z.string().min(1).default('change-me-in-production'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // SAP mirror (read-only PostgreSQL mirror of SAP B1 data)
  SAP_MIRROR_URL: z.string().default('postgresql://pi_l2_ro:changeme@localhost:5433/sap_mirror'),
  SAP_MIRROR_COMPANY_DB: z.string().default('SBO_DURACRETO1'),

  // Sibling service URLs for sync push
  OTL_CORE_URL: z.string().url().default('http://localhost:3000'),
  PEOB_URL: z.string().url().default('http://localhost:3005'),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (!_config) {
    _config = envSchema.parse(process.env);
  }
  return _config;
}
