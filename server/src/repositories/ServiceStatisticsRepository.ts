import { DatabaseConnection } from '../config/database';
import { IServiceStatisticsRepository } from '../interfaces/IRepository';
import { Pool } from 'pg';

export class ServiceStatisticsRepository implements IServiceStatisticsRepository {
  private pool: Pool;

  constructor() {
    this.pool = DatabaseConnection.getInstance().getPool();
  }

  async findById(id: number): Promise<any | null> {
    const res = await this.pool.query('SELECT * FROM service_statistics WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findAll(): Promise<any[]> {
    const res = await this.pool.query('SELECT * FROM service_statistics ORDER BY stat_date DESC');
    return res.rows;
  }

  async findByServiceId(serviceId: number): Promise<any[]> {
    const res = await this.pool.query(
      'SELECT * FROM service_statistics WHERE service_id = $1 ORDER BY stat_date DESC LIMIT 30',
      [serviceId]
    );
    return res.rows;
  }

  async findByServiceIdAndDate(serviceId: number, date: string): Promise<any | null> {
    const res = await this.pool.query(
      'SELECT * FROM service_statistics WHERE service_id = $1 AND stat_date = $2',
      [serviceId, date]
    );
    return res.rows[0] || null;
  }

  async upsert(serviceId: number, date: string, data: any): Promise<void> {
    const existing = await this.findByServiceIdAndDate(serviceId, date);
    if (existing) {
      await this.pool.query(`
        UPDATE service_statistics
        SET total_tokens = $1, completed_tokens = $2, cancelled_tokens = $3,
            average_wait_time_minutes = $4, average_service_time_minutes = $5
        WHERE service_id = $6 AND stat_date = $7
      `, [
        data.totalTokens ?? data.total_tokens ?? existing.total_tokens,
        data.completedTokens ?? data.completed_tokens ?? existing.completed_tokens,
        data.cancelledTokens ?? data.cancelled_tokens ?? existing.cancelled_tokens,
        data.averageWaitTimeMinutes ?? data.average_wait_time_minutes ?? existing.average_wait_time_minutes,
        data.averageServiceTimeMinutes ?? data.average_service_time_minutes ?? existing.average_service_time_minutes,
        serviceId, date
      ]);
    } else {
      await this.pool.query(`
        INSERT INTO service_statistics (service_id, stat_date, total_tokens, completed_tokens, cancelled_tokens, average_wait_time_minutes, average_service_time_minutes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        serviceId, date,
        data.totalTokens ?? data.total_tokens ?? 0,
        data.completedTokens ?? data.completed_tokens ?? 0,
        data.cancelledTokens ?? data.cancelled_tokens ?? 0,
        data.averageWaitTimeMinutes ?? data.average_wait_time_minutes ?? 0,
        data.averageServiceTimeMinutes ?? data.average_service_time_minutes ?? 0
      ]);
    }
  }

  async save(entity: any): Promise<any> {
    await this.upsert(entity.serviceId || entity.service_id, entity.statDate || entity.stat_date, entity);
    return this.findByServiceIdAndDate(entity.serviceId || entity.service_id, entity.statDate || entity.stat_date);
  }

  async update(id: number, data: any): Promise<any | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    await this.upsert(existing.service_id, existing.stat_date, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const res = await this.pool.query('DELETE FROM service_statistics WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
