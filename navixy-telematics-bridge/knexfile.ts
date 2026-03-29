import type { Knex } from 'knex';

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgresql://ntb:ntb_dev@localhost:5433/ntb_bridge',
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
