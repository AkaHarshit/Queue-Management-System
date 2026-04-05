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
  findById(id: number): T | null;
  findAll(): T[];
}

/** Write repository operations (ISP) */
export interface IWriteRepository<T> {
  save(entity: Partial<T>): T;
  update(id: number, entity: Partial<T>): T | null;
  delete(id: number): boolean;
}

/** Combined CRUD repository */
export interface IRepository<T> extends IReadRepository<T>, IWriteRepository<T> {}

/** User-specific query methods */
export interface IUserRepository extends IRepository<any> {
  findByEmail(email: string): any | null;
  findByRole(role: string): any[];
}

/** Token-specific query methods */
export interface ITokenRepository extends IRepository<any> {
  findByCustomerId(customerId: number): any[];
  findByServiceId(serviceId: number): any[];
  findByStatus(status: string): any[];
  findActiveTokensByService(serviceId: number): any[];
  findLastTokenNumber(serviceId: number): number;
}

/** Queue-specific query methods */
export interface IQueueRepository extends IRepository<any> {
  findByServiceId(serviceId: number): any | null;
  addTokenToQueue(queueId: number, tokenId: number, position: number): void;
  removeTokenFromQueue(tokenId: number): void;
  getQueueTokens(queueId: number): any[];
}

/** Service-specific query methods */
export interface IServiceRepository extends IRepository<any> {
  findByIsActive(isActive: boolean): any[];
  findByStaffId(staffId: number): any[];
}

/** Notification-specific query methods */
export interface INotificationRepository extends IRepository<any> {
  findByUserId(userId: number): any[];
  findUnreadByUserId(userId: number): any[];
  markAsRead(id: number): void;
}

/** Statistics-specific query methods */
export interface IServiceStatisticsRepository extends IRepository<any> {
  findByServiceId(serviceId: number): any[];
  findByServiceIdAndDate(serviceId: number, date: string): any | null;
  upsert(serviceId: number, date: string, data: any): void;
}
