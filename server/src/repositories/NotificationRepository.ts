import { DatabaseConnection } from '../config/database';
import { INotificationRepository } from '../interfaces/IRepository';
import { Pool } from 'pg';

export class NotificationRepository implements INotificationRepository {
  private pool: Pool;

  constructor() {
    this.pool = DatabaseConnection.getInstance().getPool();
  }

  async findById(id: number): Promise<any | null> {
    const res = await this.pool.query('SELECT * FROM notifications WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findAll(): Promise<any[]> {
    const res = await this.pool.query('SELECT * FROM notifications ORDER BY sent_at DESC');
    return res.rows;
  }

  async findByUserId(userId: number): Promise<any[]> {
    const res = await this.pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY sent_at DESC LIMIT 50',
      [userId]
    );
    return res.rows;
  }

  async findUnreadByUserId(userId: number): Promise<any[]> {
    const res = await this.pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 AND is_read = 0 ORDER BY sent_at DESC',
      [userId]
    );
    return res.rows;
  }

  async markAsRead(id: number): Promise<void> {
    await this.pool.query(
      "UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );
  }

  async save(notification: any): Promise<any> {
    const res = await this.pool.query(`
      INSERT INTO notifications (token_id, user_id, notification_type, title, message)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [
      notification.tokenId || notification.token_id || null,
      notification.userId || notification.user_id,
      notification.notificationType || notification.notification_type,
      notification.title,
      notification.message
    ]);
    return this.findById(res.rows[0].id);
  }

  async update(id: number, data: any): Promise<any | null> {
    if (data.isRead || data.is_read) {
      await this.markAsRead(id);
    }
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const res = await this.pool.query('DELETE FROM notifications WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.pool.query(
      "UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = 0",
      [userId]
    );
  }
}
