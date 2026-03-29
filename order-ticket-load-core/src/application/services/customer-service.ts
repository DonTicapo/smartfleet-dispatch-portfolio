import type { Customer } from '../../domain/entities/customer.js';
import { EntityNotFoundError } from '../../domain/errors/domain-error.js';
import type { CustomerRepository } from '../../infrastructure/repositories/customer-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';

export interface CreateCustomerInput {
  externalId?: string | null;
  name: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  billingAddress?: { line1: string; line2?: string; city: string; state: string; postalCode: string; country: string } | null;
}

export class CustomerService {
  constructor(
    private customerRepo: CustomerRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async create(input: CreateCustomerInput, actor: string): Promise<Customer> {
    const customer = await this.customerRepo.create({
      externalId: input.externalId ?? null,
      name: input.name,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      billingAddress: input.billingAddress ?? null,
    });

    await this.auditRepo.log({
      entityType: 'Customer',
      entityId: customer.id,
      action: 'CREATE',
      actor,
    });

    return customer;
  }

  async getById(id: string): Promise<Customer> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) throw new EntityNotFoundError('Customer', id);
    return customer;
  }
}
