import { DatabaseConnection } from '../config/database';
import { IUserRepository } from '../interfaces/IRepository';
import Database from 'better-sqlite3';

/**
 * UserRepository — Repository Pattern (DIP)
 *
 * Concrete implementation of IUserRepository.
 * SRP: Only handles user data persistence.
 */
export class UserRepository implements IUserRepository {
  private db: Database.Database;

  constructor() {
    this.db = DatabaseConnection.getInstance().getDb();
  }

  findById(id: number): any | null {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
  }

  findAll(): any[] {
    return this.db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  }

  findByEmail(email: string): any | null {
    return this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null;
  }

  findByRole(role: string): any[] {
    return this.db.prepare('SELECT * FROM users WHERE role = ?').all(role);
  }

  save(user: any): any {
    const stmt = this.db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      user.email, user.passwordHash || user.password_hash,
      user.firstName || user.first_name,
      user.lastName || user.last_name,
      user.phoneNumber || user.phone_number || null,
      user.role
    );
    return this.findById(result.lastInsertRowid as number);
  }

  update(id: number, user: any): any | null {
    const fields: string[] = [];
    const values: any[] = [];

    if (user.email) { fields.push('email = ?'); values.push(user.email); }
    if (user.firstName || user.first_name) { fields.push('first_name = ?'); values.push(user.firstName || user.first_name); }
    if (user.lastName || user.last_name) { fields.push('last_name = ?'); values.push(user.lastName || user.last_name); }
    if (user.phoneNumber !== undefined || user.phone_number !== undefined) {
      fields.push('phone_number = ?'); values.push(user.phoneNumber ?? user.phone_number);
    }
    if (user.passwordHash || user.password_hash) { fields.push('password_hash = ?'); values.push(user.passwordHash || user.password_hash); }
    if (user.role) { fields.push('role = ?'); values.push(user.role); }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = datetime('now')");
    values.push(id);

    this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  }

  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /** Create a customer record linked to a user */
  createCustomer(userId: number): any {
    const result = this.db.prepare('INSERT INTO customers (user_id) VALUES (?)').run(userId);
    return this.db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid as number);
  }

  /** Create a staff record linked to a user */
  createStaff(userId: number, serviceId?: number): any {
    const result = this.db.prepare('INSERT INTO staff (user_id, service_id) VALUES (?, ?)').run(userId, serviceId || null);
    return this.db.prepare('SELECT * FROM staff WHERE id = ?').get(result.lastInsertRowid as number);
  }

  /** Create an admin record linked to a user */
  createAdmin(userId: number): any {
    const result = this.db.prepare('INSERT INTO admins (user_id) VALUES (?)').run(userId);
    return this.db.prepare('SELECT * FROM admins WHERE id = ?').get(result.lastInsertRowid as number);
  }

  /** Find customer by user_id */
  findCustomerByUserId(userId: number): any | null {
    return this.db.prepare('SELECT * FROM customers WHERE user_id = ?').get(userId) || null;
  }

  /** Find staff by user_id */
  findStaffByUserId(userId: number): any | null {
    return this.db.prepare('SELECT * FROM staff WHERE user_id = ?').get(userId) || null;
  }

  /** Find staff by service_id */
  findStaffByServiceId(serviceId: number): any[] {
    return this.db.prepare('SELECT s.*, u.first_name, u.last_name, u.email FROM staff s JOIN users u ON s.user_id = u.id WHERE s.service_id = ?').all(serviceId);
  }

  /** Get user with role-specific details */
  findUserWithDetails(userId: number): any | null {
    const user = this.findById(userId);
    if (!user) return null;

    let details = null;
    if (user.role === 'CUSTOMER') {
      details = this.findCustomerByUserId(userId);
    } else if (user.role === 'STAFF') {
      details = this.findStaffByUserId(userId);
    }

    return { ...user, details };
  }
}
