/**
 * ConfigManager — Singleton Pattern
 *
 * Centralized configuration management.
 * SRP: Only responsible for application configuration.
 */
export class ConfigManager {
  private static instance: ConfigManager;

  public readonly port: number;
  public readonly jwtSecret: string;
  public readonly jwtExpiresIn: string;
  public readonly corsOrigin: string;

  private constructor() {
    this.port = parseInt(process.env.PORT || '3001', 10);
    this.jwtSecret = process.env.JWT_SECRET || 'queue-management-secret-key-2024';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    this.corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  }

  /** Singleton accessor */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
}
