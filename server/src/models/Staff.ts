import { User } from './User';
import { Role } from './enums';

/**
 * Staff — Extends User (LSP).
 * Represents staff members assigned to services who process tokens.
 *
 * SRP: Only manages staff-specific behaviour (processing tokens, service assignment).
 */
export class Staff extends User {
  public staffId: number;
  public serviceId: number | null;
  public isAvailable: boolean;

  constructor(data: Partial<Staff> & { email: string; passwordHash: string; firstName: string; lastName: string }) {
    super({ ...data, role: Role.STAFF });
    this.staffId = data.staffId ?? 0;
    this.serviceId = data.serviceId ?? null;
    this.isAvailable = data.isAvailable ?? true;
  }
}
