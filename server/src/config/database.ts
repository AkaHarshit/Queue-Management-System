import Database from 'better-sqlite3';
import path from 'path';

/**
 * Database — Singleton Pattern
 *
 * Ensures only one database connection exists throughout the application.
 * Uses SQLite via better-sqlite3 for zero-config persistence.
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database.Database;

  private constructor() {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'queue_management.db');
    // Ensure data directory exists
    const fs = require('fs');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initializeTables();
  }

  /** Singleton accessor */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /** Get the raw database instance */
  public getDb(): Database.Database {
    return this.db;
  }

  /** Initialize all tables from the ER diagram */
  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone_number TEXT,
        role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK(role IN ('CUSTOMER','STAFF','ADMIN')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        service_id INTEGER,
        is_available INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        estimated_duration_minutes INTEGER NOT NULL CHECK(estimated_duration_minutes > 0),
        is_active INTEGER DEFAULT 1,
        staff_id INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_number INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'WAITING' CHECK(status IN ('WAITING','IN_PROGRESS','COMPLETED','CANCELLED')),
        customer_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        queue_position INTEGER DEFAULT 0 CHECK(queue_position >= 0),
        estimated_wait_time_minutes INTEGER DEFAULT 0 CHECK(estimated_wait_time_minutes >= 0),
        created_at TEXT DEFAULT (datetime('now')),
        started_at TEXT,
        completed_at TEXT,
        cancelled_at TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS queues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER NOT NULL UNIQUE,
        current_position INTEGER DEFAULT 0 CHECK(current_position >= 0),
        total_tokens_today INTEGER DEFAULT 0 CHECK(total_tokens_today >= 0),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS queue_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        queue_id INTEGER NOT NULL,
        token_id INTEGER NOT NULL UNIQUE,
        position_in_queue INTEGER NOT NULL CHECK(position_in_queue >= 0),
        added_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (queue_id) REFERENCES queues(id) ON DELETE CASCADE,
        FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_id INTEGER,
        user_id INTEGER NOT NULL,
        notification_type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        sent_at TEXT DEFAULT (datetime('now')),
        read_at TEXT,
        FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS service_statistics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT NOT NULL UNIQUE,
        setting_value TEXT NOT NULL,
        description TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
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
  }

  /** Close the database connection */
  public close(): void {
    this.db.close();
  }
}
