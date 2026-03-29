import type { Job } from '../../domain/entities/job.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { JobRepository } from '../../infrastructure/repositories/job-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export interface CreateJobInput {
  customerId: string;
  siteId: string;
  name: string;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export class JobService {
  constructor(
    private jobRepo: JobRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async create(input: CreateJobInput, actor: string): Promise<Job> {
    const job = await this.jobRepo.create({
      customerId: input.customerId,
      siteId: input.siteId,
      name: input.name,
      description: input.description ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
    });

    await this.auditRepo.log({
      entityType: 'Job',
      entityId: job.id,
      action: 'CREATE',
      actor,
    });

    return job;
  }

  async getById(id: string): Promise<Job> {
    const job = await this.jobRepo.findById(id);
    if (!job) throw new EntityNotFoundError('Job', id);
    return job;
  }
}
