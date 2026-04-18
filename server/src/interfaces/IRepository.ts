/**
 * Repository Interfaces — ISP (Interface Segregation Principle)
 *
 * Repositories are split into focused interfaces so that consumers
 * only depend on the methods they actually use.
 *
 * DIP: All services depend on these interfaces, not concrete implementations.
 */

/** Read-only repository operations (ISP) */
export interface IReadRepository<T> {
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
}

/** Write repository operations (ISP) */
export interface IWriteRepository<T> {
  save(entity: Partial<T>): Promise<T>;
  update(id: number, entity: Partial<T>): Promise<T | null>;
  delete(id: number): Promise<boolean>;
}

/** Combined CRUD repository */
export interface IRepository<T> extends IReadRepository<T>, IWriteRepository<T> {}

/** User-specific query methods */
export interface IUserRepository extends IRepository<any> {
  findByEmail(email: string): Promise<any | null>;
  findByRole(role: string): Promise<any[]>;
}

/** Token-specific query methods */
export interface ITokenRepository extends IRepository<any> {
  findByCustomerId(customerId: number): Promise<any[]>;
  findByServiceId(serviceId: number): Promise<any[]>;
  findByStatus(status: string): Promise<any[]>;
  findActiveTokensByService(serviceId: number): Promise<any[]>;
  findLastTokenNumber(serviceId: number): Promise<number>;
}

/** Queue-specific query methods */
export interface IQueueRepository extends IRepository<any> {
  findByServiceId(serviceId: number): Promise<any | null>;
  addTokenToQueue(queueId: number, tokenId: number, position: number): Promise<void>;
  removeTokenFromQueue(tokenId: number): Promise<void>;
  getQueueTokens(queueId: number): Promise<any[]>;
}

/** Service-specific query methods */
export interface IServiceRepository extends IRepository<any> {
  findByIsActive(isActive: boolean): Promise<any[]>;
  findByStaffId(staffId: number): Promise<any[]>;
}

/** Notification-specific query methods */
export interface INotificationRepository extends IRepository<any> {
  findByUserId(userId: number): Promise<any[]>;
  findUnreadByUserId(userId: number): Promise<any[]>;
  markAsRead(id: number): Promise<void>;
}

/** Statistics-specific query methods */
export interface IServiceStatisticsRepository extends IRepository<any> {
  findByServiceId(serviceId: number): Promise<any[]>;
  findByServiceIdAndDate(serviceId: number, date: string): Promise<any | null>;
  upsert(serviceId: number, date: string, data: any): Promise<void>;
}
