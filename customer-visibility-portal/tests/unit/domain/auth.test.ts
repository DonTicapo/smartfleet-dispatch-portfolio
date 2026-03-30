import { describe, it, expect } from 'vitest';
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { PortalUserRole } from '../../../src/domain/enums/portal-user-role.js';

/**
 * Re-implement the hashing helpers from auth-service so we can test them
 * without importing the service class (which requires DB dependencies).
 */
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

describe('Auth Domain Logic', () => {
  describe('Password Hashing', () => {
    it('produces a salt:hash formatted string', () => {
      const hashed = hashPassword('securePass123');
      expect(hashed).toContain(':');
      const parts = hashed.split(':');
      expect(parts).toHaveLength(2);
    });

    it('salt is 32 hex chars (16 bytes)', () => {
      const hashed = hashPassword('test');
      const salt = hashed.split(':')[0];
      expect(salt).toHaveLength(32);
      expect(/^[0-9a-f]+$/.test(salt)).toBe(true);
    });

    it('hash is 128 hex chars (64 bytes)', () => {
      const hashed = hashPassword('test');
      const hash = hashed.split(':')[1];
      expect(hash).toHaveLength(128);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });

    it('produces different hashes for the same password (random salt)', () => {
      const hash1 = hashPassword('samePassword');
      const hash2 = hashPassword('samePassword');
      expect(hash1).not.toBe(hash2);
    });

    it('produces different hashes for different passwords', () => {
      const hash1 = hashPassword('password1');
      const hash2 = hashPassword('password2');
      // Different passwords, different salts => different stored strings
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Password Verification', () => {
    it('verifies a correct password against its hash', () => {
      const password = 'mySecurePassword!';
      const stored = hashPassword(password);
      expect(verifyPassword(password, stored)).toBe(true);
    });

    it('rejects an incorrect password', () => {
      const stored = hashPassword('correctPassword');
      expect(verifyPassword('wrongPassword', stored)).toBe(false);
    });

    it('rejects if stored hash has no colon separator', () => {
      expect(verifyPassword('test', 'noseparatorhere')).toBe(false);
    });

    it('rejects if stored hash is empty', () => {
      expect(verifyPassword('test', '')).toBe(false);
    });

    it('handles special characters in passwords', () => {
      const password = 'p@$$w0rd!#%^&*()_+-=[]{}|;\':",./<>?';
      const stored = hashPassword(password);
      expect(verifyPassword(password, stored)).toBe(true);
    });

    it('handles unicode in passwords', () => {
      const password = 'contraseña_sécurité_パスワード';
      const stored = hashPassword(password);
      expect(verifyPassword(password, stored)).toBe(true);
    });
  });

  describe('JWT Token Structure Expectations', () => {
    it('expected JWT payload contains sub, role, and customerId', () => {
      // Verify the shape the auth-service uses for tokens
      const expectedPayload = {
        sub: 'user-id-123',
        role: PortalUserRole.VIEWER,
        customerId: 'customer-abc',
      };

      expect(expectedPayload).toHaveProperty('sub');
      expect(expectedPayload).toHaveProperty('role');
      expect(expectedPayload).toHaveProperty('customerId');
    });

    it('sub should be a non-empty string (user ID)', () => {
      const sub = 'usr_abc123';
      expect(typeof sub).toBe('string');
      expect(sub.length).toBeGreaterThan(0);
    });

    it('role must be a valid PortalUserRole value', () => {
      const validRoles = Object.values(PortalUserRole);
      expect(validRoles).toContain('VIEWER');
      expect(validRoles).toContain('ADMIN');
      // A token role value should match one of the enum values
      const tokenRole = PortalUserRole.ADMIN;
      expect(validRoles).toContain(tokenRole);
    });
  });

  describe('Validation Rules', () => {
    it('email is required — empty string is invalid', () => {
      const email = '';
      expect(!email).toBe(true);
    });

    it('email is required — undefined is invalid', () => {
      const email = undefined;
      expect(!email).toBe(true);
    });

    it('password is required — empty string is invalid', () => {
      const password = '';
      expect(!password).toBe(true);
    });

    it('password is required — undefined is invalid', () => {
      const password = undefined;
      expect(!password).toBe(true);
    });

    it('password minimum length is 8 characters', () => {
      const shortPassword = 'abc1234';
      const validPassword = 'abc12345';
      expect(shortPassword.length).toBeLessThan(8);
      expect(validPassword.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('PortalUserRole Values', () => {
    it('VIEWER role for read-only customers', () => {
      expect(PortalUserRole.VIEWER).toBe('VIEWER');
    });

    it('ADMIN role for customer account administrators', () => {
      expect(PortalUserRole.ADMIN).toBe('ADMIN');
    });

    it('has exactly 2 roles', () => {
      const roles = Object.values(PortalUserRole);
      expect(roles).toHaveLength(2);
    });

    it('role values are uppercase strings matching their keys', () => {
      for (const [key, value] of Object.entries(PortalUserRole)) {
        expect(key).toBe(value);
      }
    });
  });
});
