import { DatabaseConnection } from '../config/database';
import { IServiceStatisticsRepository } from '../interfaces/IRepository';
import Database from 'better-sqlite3';

/**
 * ServiceStatisticsRepository — Repository Pattern (DIP)
 *
 * SRP: Only handles service statistics data persistence.
 */
export class ServiceStatisticsRepository implements IServiceStatisticsRepository {
  private db: Database.Database;

  constructor() {
    this.db = DatabaseConnection.getInstance().getDb();
  }

  findById(id: number): any | null {
    return this.db.prepare('SELECT * FROM service_statistics WHERE id = ?').get(id) || null;
  }

  findAll(): any[] {
    return this.db.prepare('SELECT * FROM service_statistics ORDER BY stat_date DESC').all();
  }

  findByServiceId(serviceId: number): any[] {
    return this.db.prepare(
      'SELECT * FROM service_statistics WHERE service_id = ? ORDER BY stat_date DESC LIMIT 30'
    ).all(serviceId);
  }

  findByServiceIdAndDate(serviceId: number, date: string): any | null {
    return this.db.prepare(
      'SELECT * FROM service_statistics WHERE service_id = ? AND stat_date = ?'
    ).get(serviceId, date) || null;
  }

  upsert(serviceId: number, date: string, data: any): void {
    const existing = this.findByServiceIdAndDate(serviceId, date);
    if (existing) {
      this.db.prepare(`
        UPDATE service_statistics
        SET total_tokens = ?, completed_tokens = ?, cancelled_tokens = ?,
            average_wait_time_minutes = ?, average_service_time_minutes = ?
        WHERE service_id = ? AND stat_date = ?
      `).run(
        data.totalTokens ?? data.total_tokens ?? existing.total_tokens,
        data.completedTokens ?? data.completed_tokens ?? existing.completed_tokens,
        data.cancelledTokens ?? data.cancelled_tokens ?? existing.cancelled_tokens,
        data.averageWaitTimeMinutes ?? data.average_wait_time_minutes ?? existing.average_wait_time_minutes,
        data.averageServiceTimeMinutes ?? data.average_service_time_minutes ?? existing.average_service_time_minutes,
        serviceId, date
      );
    } else {
      this.db.prepare(`
        INSERT INTO service_statistics (service_id, stat_date, total_tokens, completed_tokens, cancelled_tokens, average_wait_time_minutes, average_service_time_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        serviceId, date,
        data.totalTokens ?? data.total_tokens ?? 0,
        data.completedTokens ?? data.completed_tokens ?? 0,
        data.cancelledTokens ?? data.cancelled_tokens ?? 0,
        data.averageWaitTimeMinutes ?? data.average_wait_time_minutes ?? 0,
        data.averageServiceTimeMinutes ?? data.average_service_time_minutes ?? 0
      );
    }
  }

  save(entity: any): any {
    this.upsert(entity.serviceId || entity.service_id, entity.statDate || entity.stat_date, entity);
    return this.findByServiceIdAndDate(entity.serviceId || entity.service_id, entity.statDate || entity.stat_date);
  }

  update(id: number, data: any): any | null {
    const existing = this.findById(id);
    if (!existing) return null;
    this.upsert(existing.service_id, existing.stat_date, data);
    return this.findById(id);
  }

  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM service_statistics WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
