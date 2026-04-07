import { DatabaseConnection } from '../config/database';
import { IQueueRepository } from '../interfaces/IRepository';
import Database from 'better-sqlite3';

/**
 * QueueRepository — Repository Pattern (DIP)
 *
 * SRP: Only handles queue and queue_tokens data persistence.
 */
export class QueueRepository implements IQueueRepository {
  private db: Database.Database;

  constructor() {
    this.db = DatabaseConnection.getInstance().getDb();
  }

  findById(id: number): any | null {
    return this.db.prepare(`
      SELECT q.*, s.name as service_name
      FROM queues q
      JOIN services s ON q.service_id = s.id
      WHERE q.id = ?
    `).get(id) || null;
  }

  findAll(): any[] {
    return this.db.prepare(`
      SELECT q.*, s.name as service_name
      FROM queues q
      JOIN services s ON q.service_id = s.id
    `).all();
  }

  findByServiceId(serviceId: number): any | null {
    return this.db.prepare(`
      SELECT q.*, s.name as service_name
      FROM queues q
      JOIN services s ON q.service_id = s.id
      WHERE q.service_id = ?
    `).get(serviceId) || null;
  }

  save(queue: any): any {
    const result = this.db.prepare(
      'INSERT INTO queues (service_id, current_position, total_tokens_today) VALUES (?, ?, ?)'
    ).run(
      queue.serviceId || queue.service_id,
      queue.currentPosition || queue.current_position || 0,
      queue.totalTokensToday || queue.total_tokens_today || 0
    );
    return this.findById(result.lastInsertRowid as number);
  }

  update(id: number, data: any): any | null {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.currentPosition !== undefined || data.current_position !== undefined) {
      fields.push('current_position = ?');
      values.push(data.currentPosition ?? data.current_position);
    }
    if (data.totalTokensToday !== undefined || data.total_tokens_today !== undefined) {
      fields.push('total_tokens_today = ?');
      values.push(data.totalTokensToday ?? data.total_tokens_today);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = datetime('now')");
    values.push(id);
    this.db.prepare(`UPDATE queues SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  }

  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM queues WHERE id = ?').run(id);
    return result.changes > 0;
  }

  addTokenToQueue(queueId: number, tokenId: number, position: number): void {
    this.db.prepare(
      'INSERT INTO queue_tokens (queue_id, token_id, position_in_queue) VALUES (?, ?, ?)'
    ).run(queueId, tokenId, position);

    // Update total tokens today
    this.db.prepare(`
      UPDATE queues SET total_tokens_today = total_tokens_today + 1, updated_at = datetime('now')
      WHERE id = ?
    `).run(queueId);
  }

  removeTokenFromQueue(tokenId: number): void {
    this.db.prepare('DELETE FROM queue_tokens WHERE token_id = ?').run(tokenId);
  }

  getQueueTokens(queueId: number): any[] {
    return this.db.prepare(`
      SELECT qt.*, t.token_number, t.status, t.customer_id, t.service_id,
             t.estimated_wait_time_minutes, t.created_at as token_created_at,
             u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM queue_tokens qt
      JOIN tokens t ON qt.token_id = t.id
      JOIN customers c ON t.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE qt.queue_id = ? AND t.status IN ('WAITING', 'IN_PROGRESS')
      ORDER BY qt.position_in_queue ASC
    `).all(queueId);
  }

  /** Get count of active tokens in a queue */
  getActiveTokenCount(queueId: number): number {
    const result: any = this.db.prepare(`
      SELECT COUNT(*) as count FROM queue_tokens qt
      JOIN tokens t ON qt.token_id = t.id
      WHERE qt.queue_id = ? AND t.status IN ('WAITING', 'IN_PROGRESS')
    `).get(queueId);
    return result?.count || 0;
  }

  /** Get or create a queue for a service */
  getOrCreateForService(serviceId: number): any {
    let queue = this.findByServiceId(serviceId);
    if (!queue) {
      queue = this.save({ serviceId });
    }
    return queue;
  }
}
