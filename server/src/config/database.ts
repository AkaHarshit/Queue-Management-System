import { Pool } from 'pg';

/**
 * Database — Singleton Pattern
 *
 * Ensures only one database connection pool exists throughout the application.
 * Uses PostgreSQL via the pg library for cloud-native persistence.
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/queue_management',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    this.initializeTables().catch(err => {
      console.error('[DB] Failed to initialize tables:', err);
    });
  }

  /** Singleton accessor */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /** Get the raw connection pool */
  public getPool(): Pool {
    return this.pool;
  }

  /** Initialize all tables from the ER diagram for PostgreSQL */
  private async initializeTables(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          phone_number TEXT,
          role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK(role IN ('CUSTOMER','STAFF','ADMIN')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS staff (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          service_id INTEGER,
          is_available SMALLINT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS services (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          estimated_duration_minutes INTEGER NOT NULL CHECK(estimated_duration_minutes > 0),
          is_active SMALLINT DEFAULT 1,
          staff_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS tokens (
          id SERIAL PRIMARY KEY,
          token_number INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'WAITING' CHECK(status IN ('WAITING','IN_PROGRESS','COMPLETED','CANCELLED')),
          customer_id INTEGER NOT NULL,
          service_id INTEGER NOT NULL,
          queue_position INTEGER DEFAULT 0 CHECK(queue_position >= 0),
          estimated_wait_time_minutes INTEGER DEFAULT 0 CHECK(estimated_wait_time_minutes >= 0),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          cancelled_at TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS queues (
          id SERIAL PRIMARY KEY,
          service_id INTEGER NOT NULL UNIQUE,
          current_position INTEGER DEFAULT 0 CHECK(current_position >= 0),
          total_tokens_today INTEGER DEFAULT 0 CHECK(total_tokens_today >= 0),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS queue_tokens (
          id SERIAL PRIMARY KEY,
          queue_id INTEGER NOT NULL,
          token_id INTEGER NOT NULL UNIQUE,
          position_in_queue INTEGER NOT NULL CHECK(position_in_queue >= 0),
          added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (queue_id) REFERENCES queues(id) ON DELETE CASCADE,
          FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          token_id INTEGER,
          user_id INTEGER NOT NULL,
          notification_type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read SMALLINT DEFAULT 0,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          read_at TIMESTAMP,
          FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS service_statistics (
          id SERIAL PRIMARY KEY,
          service_id INTEGER NOT NULL,
          stat_date TEXT NOT NULL,
          total_tokens INTEGER DEFAULT 0 CHECK(total_tokens >= 0),
          completed_tokens INTEGER DEFAULT 0 CHECK(completed_tokens >= 0),
          cancelled_tokens INTEGER DEFAULT 0 CHECK(cancelled_tokens >= 0),
          average_wait_time_minutes INTEGER DEFAULT 0 CHECK(average_wait_time_minutes >= 0),
          average_service_time_minutes INTEGER DEFAULT 0 CHECK(average_service_time_minutes >= 0),
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
          UNIQUE(service_id, stat_date)
        );

        CREATE TABLE IF NOT EXISTS system_settings (
          id SERIAL PRIMARY KEY,
          setting_key TEXT NOT NULL UNIQUE,
          setting_value TEXT NOT NULL,
          description TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
        CREATE INDEX IF NOT EXISTS idx_tokens_service_id ON tokens(service_id);
        CREATE INDEX IF NOT EXISTS idx_tokens_customer_id ON tokens(customer_id);
        CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at);
        CREATE INDEX IF NOT EXISTS idx_queue_tokens_queue_id ON queue_tokens(queue_id);
        CREATE INDEX IF NOT EXISTS idx_queue_tokens_position ON queue_tokens(position_in_queue);
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
        CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
        CREATE INDEX IF NOT EXISTS idx_service_statistics_service_id ON service_statistics(service_id);
      `);
      console.log('[DB] PostgreSQL tables verified.');
    } finally {
      client.release();
    }
  }

  /** Close the database pool */
  public async close(): Promise<void> {
    await this.pool.end();
  }
}
