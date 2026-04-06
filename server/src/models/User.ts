import { Role } from './enums';

/**
 * User — Base class for all users in the system (LSP base).
 *
 * SRP: Responsible only for holding user identity data.
 * LSP: Customer, Staff, Admin extend this class and are fully substitutable.
 */
export class User {
  public id: number;
  public email: string;
  public passwordHash: string;
  public firstName: string;
  public lastName: string;
  public phoneNumber: string | null;
  public role: Role;
  public createdAt: string;
  public updatedAt: string;

  constructor(data: Partial<User> & { email: string; passwordHash: string; firstName: string; lastName: string; role: Role }) {
    this.id = data.id ?? 0;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.phoneNumber = data.phoneNumber ?? null;
    this.role = data.role;
    this.createdAt = data.createdAt ?? new Date().toISOString();
    this.updatedAt = data.updatedAt ?? new Date().toISOString();
  }

  /** Get full display name */
  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /** Convert to a safe JSON (no password) */
  public toSafeJSON(): Omit<User, 'passwordHash' | 'toSafeJSON' | 'getFullName'> {
    const { passwordHash, ...safe } = this as any;
    return safe;
  }
}
