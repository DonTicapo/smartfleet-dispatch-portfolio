import type { Knex } from 'knex';

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgresql://otl:otl_dev@localhost:5432/otl_core',
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
