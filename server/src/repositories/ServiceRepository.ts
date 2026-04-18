import { DatabaseConnection } from '../config/database';
import { IServiceRepository } from '../interfaces/IRepository';
import { Pool } from 'pg';

export class ServiceRepository implements IServiceRepository {
  private pool: Pool;

  constructor() {
    this.pool = DatabaseConnection.getInstance().getPool();
  }

  async findById(id: number): Promise<any | null> {
    const res = await this.pool.query(`
      SELECT s.*, st.user_id as staff_user_id,
             u.first_name as staff_first_name, u.last_name as staff_last_name
      FROM services s
      LEFT JOIN staff st ON s.staff_id = st.id
      LEFT JOIN users u ON st.user_id = u.id
      WHERE s.id = $1
    `, [id]);
    return res.rows[0] || null;
  }

  async findAll(): Promise<any[]> {
    const res = await this.pool.query(`
      SELECT s.*, st.user_id as staff_user_id,
             u.first_name as staff_first_name, u.last_name as staff_last_name
      FROM services s
      LEFT JOIN staff st ON s.staff_id = st.id
      LEFT JOIN users u ON st.user_id = u.id
      ORDER BY s.name ASC
    `);
    return res.rows;
  }

  async findByIsActive(isActive: boolean): Promise<any[]> {
    const res = await this.pool.query(`
      SELECT s.*, st.user_id as staff_user_id,
             u.first_name as staff_first_name, u.last_name as staff_last_name
      FROM services s
      LEFT JOIN staff st ON s.staff_id = st.id
      LEFT JOIN users u ON st.user_id = u.id
      WHERE s.is_active = $1
      ORDER BY s.name ASC
    `, [isActive ? 1 : 0]);
    return res.rows;
  }

  async findByStaffId(staffId: number): Promise<any[]> {
    const res = await this.pool.query('SELECT * FROM services WHERE staff_id = $1', [staffId]);
    return res.rows;
  }

  async save(service: any): Promise<any> {
    const res = await this.pool.query(`
      INSERT INTO services (name, description, estimated_duration_minutes, is_active, staff_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [
      service.name,
      service.description || null,
      service.estimatedDurationMinutes || service.estimated_duration_minutes,
      service.isActive !== undefined ? (service.isActive ? 1 : 0) : 1,
      service.staffId || service.staff_id || null
    ]);
    return this.findById(res.rows[0].id);
  }

  async update(id: number, data: any): Promise<any | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
    if (data.estimatedDurationMinutes || data.estimated_duration_minutes) {
      fields.push(`estimated_duration_minutes = $${idx++}`);
      values.push(data.estimatedDurationMinutes || data.estimated_duration_minutes);
    }
    if (data.isActive !== undefined || data.is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push((data.isActive ?? data.is_active) ? 1 : 0);
    }
    if (data.staffId !== undefined || data.staff_id !== undefined) {
      fields.push(`staff_id = $${idx++}`);
      values.push(data.staffId ?? data.staff_id);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    await this.pool.query(`UPDATE services SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const res = await this.pool.query('DELETE FROM services WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
