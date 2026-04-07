import { DatabaseConnection } from '../config/database';
import { INotificationRepository } from '../interfaces/IRepository';
import Database from 'better-sqlite3';

/**
 * NotificationRepository — Repository Pattern (DIP)
 *
 * SRP: Only handles notification data persistence.
 */
export class NotificationRepository implements INotificationRepository {
  private db: Database.Database;

  constructor() {
    this.db = DatabaseConnection.getInstance().getDb();
  }

  findById(id: number): any | null {
    return this.db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) || null;
  }

  findAll(): any[] {
    return this.db.prepare('SELECT * FROM notifications ORDER BY sent_at DESC').all();
  }

  findByUserId(userId: number): any[] {
    return this.db.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY sent_at DESC LIMIT 50'
    ).all(userId);
  }

  findUnreadByUserId(userId: number): any[] {
    return this.db.prepare(
      'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY sent_at DESC'
    ).all(userId);
  }

  markAsRead(id: number): void {
    this.db.prepare(
      "UPDATE notifications SET is_read = 1, read_at = datetime('now') WHERE id = ?"
    ).run(id);
  }

  save(notification: any): any {
    const result = this.db.prepare(`
      INSERT INTO notifications (token_id, user_id, notification_type, title, message)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      notification.tokenId || notification.token_id || null,
      notification.userId || notification.user_id,
      notification.notificationType || notification.notification_type,
      notification.title,
      notification.message
    );
    return this.findById(result.lastInsertRowid as number);
  }

  update(id: number, data: any): any | null {
    if (data.isRead || data.is_read) {
      this.markAsRead(id);
    }
    return this.findById(id);
  }

  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /** Mark all notifications as read for a user */
  markAllAsRead(userId: number): void {
    this.db.prepare(
      "UPDATE notifications SET is_read = 1, read_at = datetime('now') WHERE user_id = ? AND is_read = 0"
    ).run(userId);
  }
}
