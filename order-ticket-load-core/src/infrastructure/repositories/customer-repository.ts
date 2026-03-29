import type { Knex } from 'knex';
import type { Customer } from '../../domain/entities/customer.js';
import type { Address } from '../../domain/value-objects/address.js';

interface CustomerRow {
  id: string;
  external_id: string | null;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  billing_address: Address | null;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: CustomerRow): Customer {
  return {
    id: row.id,
    externalId: row.external_id,
    name: row.name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    billingAddress: row.billing_address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CustomerRepository {
  constructor(private db: Knex) {}

  async create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const [row] = await this.db('customers')
      .insert({
        external_id: data.externalId,
        name: data.name,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        billing_address: data.billingAddress ? JSON.stringify(data.billingAddress) : null,
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<Customer | null> {
    const row = await this.db('customers').where({ id }).first();
    return row ? toEntity(row) : null;
  }
}
