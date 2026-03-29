import type { Knex } from 'knex';

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgresql://peob:peob_dev@localhost:5432/peob_bridge',
  migrations: {
    directory: './src/infrastructure/database/migrations',
    extension: 'ts',
  },
};

export default config;
