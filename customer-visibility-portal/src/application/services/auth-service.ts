import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import type { Knex } from 'knex';
import type { PortalUser } from '../../domain/entities/portal-user.js';
import { PortalUserRole } from '../../domain/enums/portal-user-role.js';
import {
  AuthenticationError,
  EntityNotFoundError,
  DuplicateEntityError,
  ValidationError,
} from '../../domain/errors/domain-error.js';
import type { PortalUserRepository } from '../../infrastructure/repositories/portal-user-repository.js';
import type { AuditLogRepository } from '../../infrastructure/repositories/audit-log-repository.js';
import { getConfig } from '../../config.js';

const SCRYPT_KEY_LENGTH = 64;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  const storedKey = Buffer.from(hash, 'hex');
  return timingSafeEqual(derivedKey, storedKey);
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: Omit<PortalUser, 'passwordHash'>;
}

export interface CreatePortalUserInput {
  customerId: string;
  email: string;
  name: string;
  role: PortalUserRole;
  password: string;
}

export class AuthService {
  constructor(
    private db: Knex,
    private userRepo: PortalUserRepository,
    private auditRepo: AuditLogRepository,
  ) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(input.email);

    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!verifyPassword(input.password, user.passwordHash)) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Update last login time within a transaction
    await this.db.transaction(async (trx) => {
      await this.userRepo.updateLastLogin(user.id, trx);
      await this.auditRepo.log(
        {
          entityType: 'PortalUser',
          entityId: user.id,
          action: 'LOGIN',
          actor: user.id,
        },
        trx,
      );
    });

    const config = getConfig();
    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        customerId: user.customerId,
      },
      config.JWT_SECRET,
      { expiresIn: '8h' },
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return {
      token,
      user: { ...userWithoutPassword, lastLoginAt: new Date() },
    };
  }

  async createUser(input: CreatePortalUserInput, actor: string): Promise<PortalUser> {
    if (!input.email || !input.password) {
      throw new ValidationError('Email and password are required');
    }

    if (input.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new DuplicateEntityError('PortalUser', 'email', input.email);
    }

    const passwordHash = hashPassword(input.password);

    return this.db.transaction(async (trx) => {
      const user = await this.userRepo.create(
        {
          customerId: input.customerId,
          email: input.email,
          name: input.name,
          role: input.role,
          passwordHash,
          lastLoginAt: null,
          isActive: true,
        },
        trx,
      );

      await this.auditRepo.log(
        {
          entityType: 'PortalUser',
          entityId: user.id,
          action: 'CREATE',
          actor,
          changes: { email: input.email, role: input.role },
        },
        trx,
      );

      return user;
    });
  }

  async getUser(id: string): Promise<PortalUser> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new EntityNotFoundError('PortalUser', id);
    return user;
  }

  async deactivateUser(id: string, actor: string): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new EntityNotFoundError('PortalUser', id);

    await this.db.transaction(async (trx) => {
      await this.userRepo.deactivate(id, trx);
      await this.auditRepo.log(
        {
          entityType: 'PortalUser',
          entityId: id,
          action: 'DEACTIVATE',
          actor,
        },
        trx,
      );
    });
  }
}
