import { TokenStatus } from './enums';

/**
 * Token — Represents a queue token assigned to a customer for a service.
 *
 * SRP: Only manages token state and lifecycle data.
 * Created by TokenFactory (Factory Pattern).
 */
export class Token {
  public id: number;
  public tokenNumber: number;
  public status: TokenStatus;
  public customerId: number;
  public serviceId: number;
  public queuePosition: number;
  public estimatedWaitTimeMinutes: number;
  public createdAt: string;
  public startedAt: string | null;
  public completedAt: string | null;
  public cancelledAt: string | null;

  constructor(data: Partial<Token> & { tokenNumber: number; customerId: number; serviceId: number }) {
    this.id = data.id ?? 0;
    this.tokenNumber = data.tokenNumber;
    this.status = data.status ?? TokenStatus.WAITING;
    this.customerId = data.customerId;
    this.serviceId = data.serviceId;
    this.queuePosition = data.queuePosition ?? 0;
    this.estimatedWaitTimeMinutes = data.estimatedWaitTimeMinutes ?? 0;
    this.createdAt = data.createdAt ?? new Date().toISOString();
    this.startedAt = data.startedAt ?? null;
    this.completedAt = data.completedAt ?? null;
    this.cancelledAt = data.cancelledAt ?? null;
  }

  /** Check if this token is in an active (non-terminal) state */
  public isActive(): boolean {
    return this.status === TokenStatus.WAITING || this.status === TokenStatus.IN_PROGRESS;
  }

  /** Check if this token can be cancelled */
  public isCancellable(): boolean {
    return this.status === TokenStatus.WAITING;
  }
}
