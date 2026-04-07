import { DatabaseConnection } from '../config/database';
import { IServiceRepository } from '../interfaces/IRepository';
import Database from 'better-sqlite3';

/**
 * ServiceRepository — Repository Pattern (DIP)
 *
 * SRP: Only handles service data persistence.
 */
export class ServiceRepository implements IServiceRepository {
  private db: Database.Database;

  constructor() {
    this.db = DatabaseConnection.getInstance().getDb();
  }

  findById(id: number): any | null {
    return this.db.prepare(`
      SELECT s.*, st.user_id as staff_user_id,
             u.first_name as staff_first_name, u.last_name as staff_last_name
      FROM services s
      LEFT JOIN staff st ON s.staff_id = st.id
      LEFT JOIN users u ON st.user_id = u.id
      WHERE s.id = ?
    `).get(id) || null;
  }

  findAll(): any[] {
    return this.db.prepare(`
      SELECT s.*, st.user_id as staff_user_id,
             u.first_name as staff_first_name, u.last_name as staff_last_name
      FROM services s
      LEFT JOIN staff st ON s.staff_id = st.id
      LEFT JOIN users u ON st.user_id = u.id
      ORDER BY s.name ASC
    `).all();
  }

  findByIsActive(isActive: boolean): any[] {
    return this.db.prepare(`
      SELECT s.*, st.user_id as staff_user_id,
             u.first_name as staff_first_name, u.last_name as staff_last_name
      FROM services s
      LEFT JOIN staff st ON s.staff_id = st.id
      LEFT JOIN users u ON st.user_id = u.id
      WHERE s.is_active = ?
      ORDER BY s.name ASC
    `).all(isActive ? 1 : 0);
  }

  findByStaffId(staffId: number): any[] {
    return this.db.prepare('SELECT * FROM services WHERE staff_id = ?').all(staffId);
  }

  save(service: any): any {
    const result = this.db.prepare(`
      INSERT INTO services (name, description, estimated_duration_minutes, is_active, staff_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      service.name,
      service.description || null,
      service.estimatedDurationMinutes || service.estimated_duration_minutes,
      service.isActive !== undefined ? (service.isActive ? 1 : 0) : 1,
      service.staffId || service.staff_id || null
    );
    return this.findById(result.lastInsertRowid as number);
  }

  update(id: number, data: any): any | null {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.estimatedDurationMinutes || data.estimated_duration_minutes) {
      fields.push('estimated_duration_minutes = ?');
      values.push(data.estimatedDurationMinutes || data.estimated_duration_minutes);
    }
    if (data.isActive !== undefined || data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push((data.isActive ?? data.is_active) ? 1 : 0);
    }
    if (data.staffId !== undefined || data.staff_id !== undefined) {
      fields.push('staff_id = ?');
      values.push(data.staffId ?? data.staff_id);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = datetime('now')");
    values.push(id);
    this.db.prepare(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  }

  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM services WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
