import { User } from './User';
import { Role } from './enums';

/**
 * Admin — Extends User (LSP).
 * Has administrative privileges: manage users, services, view analytics.
 *
 * SRP: Only manages admin-specific behaviour (system administration).
 */
export class Admin extends User {
  public adminId: number;

  constructor(data: Partial<Admin> & { email: string; passwordHash: string; firstName: string; lastName: string }) {
    super({ ...data, role: Role.ADMIN });
    this.adminId = data.adminId ?? 0;
  }
}
