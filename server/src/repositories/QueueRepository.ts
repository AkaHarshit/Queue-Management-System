import { DatabaseConnection } from '../config/database';
import { IQueueRepository } from '../interfaces/IRepository';
import { Pool } from 'pg';

export class QueueRepository implements IQueueRepository {
  private pool: Pool;

  constructor() {
    this.pool = DatabaseConnection.getInstance().getPool();
  }

  async findById(id: number): Promise<any | null> {
    const res = await this.pool.query(`
      SELECT q.*, s.name as service_name
      FROM queues q
      JOIN services s ON q.service_id = s.id
      WHERE q.id = $1
    `, [id]);
    return res.rows[0] || null;
  }

  async findAll(): Promise<any[]> {
    const res = await this.pool.query(`
      SELECT q.*, s.name as service_name
      FROM queues q
      JOIN services s ON q.service_id = s.id
    `);
    return res.rows;
  }

  async findByServiceId(serviceId: number): Promise<any | null> {
    const res = await this.pool.query(`
      SELECT q.*, s.name as service_name
      FROM queues q
      JOIN services s ON q.service_id = s.id
      WHERE q.service_id = $1
    `, [serviceId]);
    return res.rows[0] || null;
  }

  async save(queue: any): Promise<any> {
    const res = await this.pool.query(
      'INSERT INTO queues (service_id, current_position, total_tokens_today) VALUES ($1, $2, $3) RETURNING id',
      [
        queue.serviceId || queue.service_id,
        queue.currentPosition || queue.current_position || 0,
        queue.totalTokensToday || queue.total_tokens_today || 0
      ]
    );
    return this.findById(res.rows[0].id);
  }

  async update(id: number, data: any): Promise<any | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.currentPosition !== undefined || data.current_position !== undefined) {
      fields.push(`current_position = $${idx++}`);
      values.push(data.currentPosition ?? data.current_position);
    }
    if (data.totalTokensToday !== undefined || data.total_tokens_today !== undefined) {
      fields.push(`total_tokens_today = $${idx++}`);
      values.push(data.totalTokensToday ?? data.total_tokens_today);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    await this.pool.query(`UPDATE queues SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const res = await this.pool.query('DELETE FROM queues WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async addTokenToQueue(queueId: number, tokenId: number, position: number): Promise<void> {
    await this.pool.query(
      'INSERT INTO queue_tokens (queue_id, token_id, position_in_queue) VALUES ($1, $2, $3)',
      [queueId, tokenId, position]
    );

    await this.pool.query(`
      UPDATE queues SET total_tokens_today = total_tokens_today + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [queueId]);
  }

  async removeTokenFromQueue(tokenId: number): Promise<void> {
    await this.pool.query('DELETE FROM queue_tokens WHERE token_id = $1', [tokenId]);
  }

  async getQueueTokens(queueId: number): Promise<any[]> {
    const res = await this.pool.query(`
      SELECT qt.*, t.token_number, t.status, t.customer_id, t.service_id,
             t.estimated_wait_time_minutes, t.created_at as token_created_at,
             u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM queue_tokens qt
      JOIN tokens t ON qt.token_id = t.id
      JOIN customers c ON t.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE qt.queue_id = $1 AND t.status IN ('WAITING', 'IN_PROGRESS')
      ORDER BY qt.position_in_queue ASC
    `, [queueId]);
    return res.rows;
  }

  async getActiveTokenCount(queueId: number): Promise<number> {
    const res = await this.pool.query(`
      SELECT COUNT(*) as count FROM queue_tokens qt
      JOIN tokens t ON qt.token_id = t.id
      WHERE qt.queue_id = $1 AND t.status IN ('WAITING', 'IN_PROGRESS')
    `, [queueId]);
    return parseInt(res.rows[0]?.count || '0', 10);
  }

  async getOrCreateForService(serviceId: number): Promise<any> {
    let queue = await this.findByServiceId(serviceId);
    if (!queue) {
      queue = await this.save({ serviceId });
    }
    return queue;
  }
}
