import type { Knex } from 'knex';
import type { PortalUser } from '../../domain/entities/portal-user.js';
import type { PortalUserRole } from '../../domain/enums/portal-user-role.js';

interface PortalUserRow {
  id: string;
  customer_id: string;
  email: string;
  name: string;
  role: string;
  password_hash: string;
  last_login_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: PortalUserRow): PortalUser {
  return {
    id: row.id,
    customerId: row.customer_id,
    email: row.email,
    name: row.name,
    role: row.role as PortalUserRole,
    passwordHash: row.password_hash,
    lastLoginAt: row.last_login_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PortalUserRepository {
  constructor(private db: Knex) {}

  async create(
    data: Omit<PortalUser, 'id' | 'createdAt' | 'updatedAt'>,
    trx?: Knex.Transaction,
  ): Promise<PortalUser> {
    const qb = trx || this.db;
    const [row] = await qb('portal_users')
      .insert({
        customer_id: data.customerId,
        email: data.email,
        name: data.name,
        role: data.role,
        password_hash: data.passwordHash,
        last_login_at: data.lastLoginAt,
        is_active: data.isActive,
      })
      .returning('*');
    return toEntity(row);
  }

  async findById(id: string): Promise<PortalUser | null> {
    const row = await this.db('portal_users').where({ id }).first();
    return row ? toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<PortalUser | null> {
    const row = await this.db('portal_users').where({ email }).first();
    return row ? toEntity(row) : null;
  }

  async findByCustomerId(customerId: string): Promise<PortalUser[]> {
    const rows = await this.db('portal_users').where({ customer_id: customerId });
    return rows.map(toEntity);
  }

  async updateLastLogin(id: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx || this.db;
    await qb('portal_users')
      .where({ id })
      .update({ last_login_at: new Date(), updated_at: new Date() });
  }

  async deactivate(id: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx || this.db;
    await qb('portal_users')
      .where({ id })
      .update({ is_active: false, updated_at: new Date() });
  }
}
