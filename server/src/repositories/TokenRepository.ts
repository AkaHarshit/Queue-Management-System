import { DatabaseConnection } from '../config/database';
import { ITokenRepository } from '../interfaces/IRepository';
import { Pool } from 'pg';

export class TokenRepository implements ITokenRepository {
  private pool: Pool;

  constructor() {
    this.pool = DatabaseConnection.getInstance().getPool();
  }

  async findById(id: number): Promise<any | null> {
    const res = await this.pool.query(`
      SELECT t.*, s.name as service_name, s.estimated_duration_minutes,
             u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM tokens t
      JOIN services s ON t.service_id = s.id
      JOIN customers c ON t.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE t.id = $1
    `, [id]);
    return res.rows[0] || null;
  }

  async findAll(): Promise<any[]> {
    const res = await this.pool.query(`
      SELECT t.*, s.name as service_name,
             u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM tokens t
      JOIN services s ON t.service_id = s.id
      JOIN customers c ON t.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    return res.rows;
  }

  async findByCustomerId(customerId: number): Promise<any[]> {
    const res = await this.pool.query(`
      SELECT t.*, s.name as service_name
      FROM tokens t
      JOIN services s ON t.service_id = s.id
      WHERE t.customer_id = $1
      ORDER BY t.created_at DESC
    `, [customerId]);
    return res.rows;
  }

  async findByServiceId(serviceId: number): Promise<any[]> {
    const res = await this.pool.query(`
      SELECT t.*, u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM tokens t
      JOIN customers c ON t.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE t.service_id = $1
      ORDER BY t.queue_position ASC
    `, [serviceId]);
    return res.rows;
  }

  async findByStatus(status: string): Promise<any[]> {
    const res = await this.pool.query('SELECT * FROM tokens WHERE status = $1', [status]);
    return res.rows;
  }

  async findActiveTokensByService(serviceId: number): Promise<any[]> {
    const res = await this.pool.query(`
      SELECT t.*, u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM tokens t
      JOIN customers c ON t.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE t.service_id = $1 AND t.status IN ('WAITING', 'IN_PROGRESS')
      ORDER BY t.queue_position ASC
    `, [serviceId]);
    return res.rows;
  }

  async findLastTokenNumber(serviceId: number): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const res = await this.pool.query(`
      SELECT MAX(token_number) as max_num FROM tokens
      WHERE service_id = $1 AND DATE(created_at) = $2
    `, [serviceId, today]);
    return parseInt(res.rows[0]?.max_num || '0', 10);
  }

  async save(token: any): Promise<any> {
    const res = await this.pool.query(`
      INSERT INTO tokens (token_number, status, customer_id, service_id, queue_position, estimated_wait_time_minutes)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [
      token.tokenNumber || token.token_number,
      token.status || 'WAITING',
      token.customerId || token.customer_id,
      token.serviceId || token.service_id,
      token.queuePosition || token.queue_position || 0,
      token.estimatedWaitTimeMinutes || token.estimated_wait_time_minutes || 0
    ]);
    return this.findById(res.rows[0].id);
  }

  async update(id: number, data: any): Promise<any | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.status) { fields.push(`status = $${idx++}`); values.push(data.status); }
    if (data.queuePosition !== undefined || data.queue_position !== undefined) {
      fields.push(`queue_position = $${idx++}`); values.push(data.queuePosition ?? data.queue_position);
    }
    if (data.estimatedWaitTimeMinutes !== undefined || data.estimated_wait_time_minutes !== undefined) {
      fields.push(`estimated_wait_time_minutes = $${idx++}`); values.push(data.estimatedWaitTimeMinutes ?? data.estimated_wait_time_minutes);
    }
    if (data.startedAt || data.started_at) { fields.push(`started_at = $${idx++}`); values.push(data.startedAt || data.started_at); }
    if (data.completedAt || data.completed_at) { fields.push(`completed_at = $${idx++}`); values.push(data.completedAt || data.completed_at); }
    if (data.cancelledAt || data.cancelled_at) { fields.push(`cancelled_at = $${idx++}`); values.push(data.cancelledAt || data.cancelled_at); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await this.pool.query(`UPDATE tokens SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const res = await this.pool.query('DELETE FROM tokens WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async findActiveTokenForCustomer(customerId: number, serviceId: number): Promise<any | null> {
    const res = await this.pool.query(`
      SELECT * FROM tokens
      WHERE customer_id = $1 AND service_id = $2 AND status IN ('WAITING', 'IN_PROGRESS')
    `, [customerId, serviceId]);
    return res.rows[0] || null;
  }

  async countByStatusAndDateRange(status: string, startDate: string, endDate: string): Promise<number> {
    const res = await this.pool.query(`
      SELECT COUNT(*) as count FROM tokens
      WHERE status = $1 AND DATE(created_at) BETWEEN $2 AND $3
    `, [status, startDate, endDate]);
    return parseInt(res.rows[0]?.count || '0', 10);
  }

  async getTodayStats(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const res = await this.pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'WAITING' THEN 1 ELSE 0 END) as waiting,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
        AVG(CASE WHEN status = 'COMPLETED' AND started_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 60
          ELSE NULL END) as avg_service_time,
        AVG(CASE WHEN started_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (started_at - created_at)) / 60
          ELSE NULL END) as avg_wait_time
      FROM tokens
      WHERE DATE(created_at) = $1
    `, [today]);
    return res.rows[0];
  }
}
