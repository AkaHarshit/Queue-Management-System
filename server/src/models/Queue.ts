/**
 * Queue — Manages tokens for a specific service.
 *
 * SRP: Only manages queue state (positions, daily counts).
 * One queue per service (1:1 relationship).
 */
export class Queue {
  public id: number;
  public serviceId: number;
  public currentPosition: number;
  public totalTokensToday: number;
  public createdAt: string;
  public updatedAt: string;

  constructor(data: Partial<Queue> & { serviceId: number }) {
    this.id = data.id ?? 0;
    this.serviceId = data.serviceId;
    this.currentPosition = data.currentPosition ?? 0;
    this.totalTokensToday = data.totalTokensToday ?? 0;
    this.createdAt = data.createdAt ?? new Date().toISOString();
    this.updatedAt = data.updatedAt ?? new Date().toISOString();
  }
}
