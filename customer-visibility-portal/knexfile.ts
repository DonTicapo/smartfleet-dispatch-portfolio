import type { Knex } from 'knex';

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgresql://cvp:cvp_dev@localhost:5432/cvp_portal',
  migrations: {
    directory: './src/infrastructure/database/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: './src/infrastructure/database/seeds',
    extension: 'ts',
  },
};

export default config;
