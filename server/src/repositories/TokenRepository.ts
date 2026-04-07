import { DatabaseConnection } from '../config/database';
import { ITokenRepository } from '../interfaces/IRepository';
import Database from 'better-sqlite3';

/**
 * TokenRepository — Repository Pattern (DIP)
 *
 * SRP: Only handles token data persistence.
 */
export class TokenRepository implements ITokenRepository {
  private db: Database.Database;

  constructor() {
    this.db = DatabaseConnection.getInstance().getDb();
  }

  findById(id: number): any | null {
    return this.db.prepare(`
      SELECT t.*, s.name as service_name, s.estimated_duration_minutes,
             u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM tokens t
      JOIN services s ON t.service_id = s.id
      JOIN customers c ON t.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE t.id = ?
    `).get(id) || null;
  }

  findAll(): any[] {
    return this.db.prepare(`
      SELECT t.*, s.name as service_name,
             u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM tokens t
      JOIN services s ON t.service_id = s.id
      JOIN customers c ON t.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      ORDER BY t.created_at DESC
    `).all();
  }

  findByCustomerId(customerId: number): any[] {
    return this.db.prepare(`
      SELECT t.*, s.name as service_name
      FROM tokens t
      JOIN services s ON t.service_id = s.id
      WHERE t.customer_id = ?
      ORDER BY t.created_at DESC
    `).all(customerId);
  }

  findByServiceId(serviceId: number): any[] {
    return this.db.prepare(`
      SELECT t.*, u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM tokens t
      JOIN customers c ON t.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE t.service_id = ?
      ORDER BY t.queue_position ASC
    `).all(serviceId);
  }

  findByStatus(status: string): any[] {
    return this.db.prepare('SELECT * FROM tokens WHERE status = ?').all(status);
  }

  findActiveTokensByService(serviceId: number): any[] {
    return this.db.prepare(`
      SELECT t.*, u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM tokens t
      JOIN customers c ON t.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE t.service_id = ? AND t.status IN ('WAITING', 'IN_PROGRESS')
      ORDER BY t.queue_position ASC
    `).all(serviceId);
  }

  findLastTokenNumber(serviceId: number): number {
    const today = new Date().toISOString().split('T')[0];
    const result: any = this.db.prepare(`
      SELECT MAX(token_number) as max_num FROM tokens
      WHERE service_id = ? AND DATE(created_at) = ?
    `).get(serviceId, today);
    return result?.max_num || 0;
  }

  save(token: any): any {
    const stmt = this.db.prepare(`
      INSERT INTO tokens (token_number, status, customer_id, service_id, queue_position, estimated_wait_time_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      token.tokenNumber || token.token_number,
      token.status || 'WAITING',
      token.customerId || token.customer_id,
      token.serviceId || token.service_id,
      token.queuePosition || token.queue_position || 0,
      token.estimatedWaitTimeMinutes || token.estimated_wait_time_minutes || 0
    );
    return this.findById(result.lastInsertRowid as number);
  }

  update(id: number, data: any): any | null {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.status) { fields.push('status = ?'); values.push(data.status); }
    if (data.queuePosition !== undefined || data.queue_position !== undefined) {
      fields.push('queue_position = ?'); values.push(data.queuePosition ?? data.queue_position);
    }
    if (data.estimatedWaitTimeMinutes !== undefined || data.estimated_wait_time_minutes !== undefined) {
      fields.push('estimated_wait_time_minutes = ?'); values.push(data.estimatedWaitTimeMinutes ?? data.estimated_wait_time_minutes);
    }
    if (data.startedAt || data.started_at) { fields.push('started_at = ?'); values.push(data.startedAt || data.started_at); }
    if (data.completedAt || data.completed_at) { fields.push('completed_at = ?'); values.push(data.completedAt || data.completed_at); }
    if (data.cancelledAt || data.cancelled_at) { fields.push('cancelled_at = ?'); values.push(data.cancelledAt || data.cancelled_at); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    this.db.prepare(`UPDATE tokens SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  }

  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM tokens WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /** Find active token for a customer in a specific service */
  findActiveTokenForCustomer(customerId: number, serviceId: number): any | null {
    return this.db.prepare(`
      SELECT * FROM tokens
      WHERE customer_id = ? AND service_id = ? AND status IN ('WAITING', 'IN_PROGRESS')
    `).get(customerId, serviceId) || null;
  }

  /** Count tokens by status for a date range */
  countByStatusAndDateRange(status: string, startDate: string, endDate: string): number {
    const result: any = this.db.prepare(`
      SELECT COUNT(*) as count FROM tokens
      WHERE status = ? AND DATE(created_at) BETWEEN ? AND ?
    `).get(status, startDate, endDate);
    return result?.count || 0;
  }

  /** Get today's token stats */
  getTodayStats(): any {
    const today = new Date().toISOString().split('T')[0];
    return this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'WAITING' THEN 1 ELSE 0 END) as waiting,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
        AVG(CASE WHEN status = 'COMPLETED' AND started_at IS NOT NULL
          THEN (julianday(completed_at) - julianday(started_at)) * 24 * 60
          ELSE NULL END) as avg_service_time,
        AVG(CASE WHEN started_at IS NOT NULL
          THEN (julianday(started_at) - julianday(created_at)) * 24 * 60
          ELSE NULL END) as avg_wait_time
      FROM tokens
      WHERE DATE(created_at) = ?
    `).get(today);
  }
}
