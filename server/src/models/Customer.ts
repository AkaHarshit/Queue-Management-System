import { User } from './User';
import { Role } from './enums';

/**
 * Customer — Extends User (LSP).
 * Represents customers/patients who join queues and receive services.
 *
 * SRP: Only manages customer-specific behaviour (joining queues, viewing tokens).
 */
export class Customer extends User {
  public customerId: number;

  constructor(data: Partial<Customer> & { email: string; passwordHash: string; firstName: string; lastName: string }) {
    super({ ...data, role: Role.CUSTOMER });
    this.customerId = data.customerId ?? 0;
  }
}
