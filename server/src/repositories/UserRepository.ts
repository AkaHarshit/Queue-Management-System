import { DatabaseConnection } from '../config/database';
import { IUserRepository } from '../interfaces/IRepository';
import { Pool } from 'pg';

export class UserRepository implements IUserRepository {
  private pool: Pool;

  constructor() {
    this.pool = DatabaseConnection.getInstance().getPool();
  }

  async findById(id: number): Promise<any | null> {
    const res = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findAll(): Promise<any[]> {
    const res = await this.pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return res.rows;
  }

  async findByEmail(email: string): Promise<any | null> {
    const res = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0] || null;
  }

  async findByRole(role: string): Promise<any[]> {
    const res = await this.pool.query('SELECT * FROM users WHERE role = $1', [role]);
    return res.rows;
  }

  async save(user: any): Promise<any> {
    const res = await this.pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone_number, role)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [
      user.email, user.passwordHash || user.password_hash,
      user.firstName || user.first_name,
      user.lastName || user.last_name,
      user.phoneNumber || user.phone_number || null,
      user.role
    ]);
    return this.findById(res.rows[0].id);
  }

  async update(id: number, user: any): Promise<any | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (user.email) { fields.push(`email = $${idx++}`); values.push(user.email); }
    if (user.firstName || user.first_name) { fields.push(`first_name = $${idx++}`); values.push(user.firstName || user.first_name); }
    if (user.lastName || user.last_name) { fields.push(`last_name = $${idx++}`); values.push(user.lastName || user.last_name); }
    if (user.phoneNumber !== undefined || user.phone_number !== undefined) {
      fields.push(`phone_number = $${idx++}`); values.push(user.phoneNumber ?? user.phone_number);
    }
    if (user.passwordHash || user.password_hash) { fields.push(`password_hash = $${idx++}`); values.push(user.passwordHash || user.password_hash); }
    if (user.role) { fields.push(`role = $${idx++}`); values.push(user.role); }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    await this.pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const res = await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async createCustomer(userId: number): Promise<any> {
    const res = await this.pool.query('INSERT INTO customers (user_id) VALUES ($1) RETURNING id', [userId]);
    const customerRes = await this.pool.query('SELECT * FROM customers WHERE id = $1', [res.rows[0].id]);
    return customerRes.rows[0];
  }

  async createStaff(userId: number, serviceId?: number): Promise<any> {
    const res = await this.pool.query('INSERT INTO staff (user_id, service_id) VALUES ($1, $2) RETURNING id', [userId, serviceId || null]);
    const staffRes = await this.pool.query('SELECT * FROM staff WHERE id = $1', [res.rows[0].id]);
    return staffRes.rows[0];
  }

  async createAdmin(userId: number): Promise<any> {
    const res = await this.pool.query('INSERT INTO admins (user_id) VALUES ($1) RETURNING id', [userId]);
    const adminRes = await this.pool.query('SELECT * FROM admins WHERE id = $1', [res.rows[0].id]);
    return adminRes.rows[0];
  }

  async findCustomerByUserId(userId: number): Promise<any | null> {
    const res = await this.pool.query('SELECT * FROM customers WHERE user_id = $1', [userId]);
    return res.rows[0] || null;
  }

  async findStaffByUserId(userId: number): Promise<any | null> {
    const res = await this.pool.query('SELECT * FROM staff WHERE user_id = $1', [userId]);
    return res.rows[0] || null;
  }

  async findStaffByServiceId(serviceId: number): Promise<any[]> {
    const res = await this.pool.query('SELECT s.*, u.first_name, u.last_name, u.email FROM staff s JOIN users u ON s.user_id = u.id WHERE s.service_id = $1', [serviceId]);
    return res.rows;
  }

  async findUserWithDetails(userId: number): Promise<any | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    let details = null;
    if (user.role === 'CUSTOMER') {
      details = await this.findCustomerByUserId(userId);
    } else if (user.role === 'STAFF') {
      details = await this.findStaffByUserId(userId);
    }

    return { ...user, details };
  }
}
