import type { Knex } from 'knex';
import type { Job } from '../../domain/entities/job.js';

interface JobRow {
  id: string;
  customer_id: string;
  site_id: string;
  name: string;
  description: string | null;
  start_date: Date | null;
  end_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: JobRow): Job {
  return {
    id: row.id,
    customerId: row.customer_id,
    siteId: row.site_id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class JobRepository {
  constructor(private db: Knex) {}

  async create(data: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    const [row] = await this.db('jobs')
      .insert({
        customer_id: data.customerId,
        site_id: data.siteId,
        name: data.name,
        description: data.description,
        start_date: data.startDate,
        end_date: data.endDate,
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<Job | null> {
    const row = await this.db('jobs').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findByCustomerAndSite(customerId: string, siteId: string): Promise<Job | null> {
    const row = await this.db('jobs')
      .where({ customer_id: customerId, site_id: siteId })
      .first();
    return row ? toEntity(row) : null;
  }
}
