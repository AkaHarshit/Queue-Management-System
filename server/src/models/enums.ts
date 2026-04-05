// ─── Enums ───────────────────────────────────────────────────────────────────
// Follows the class diagram enum definitions

/**
 * Role enum — used for RBAC (Role-Based Access Control).
 * Adheres to OCP: new roles can be added without modifying existing logic.
 */
export enum Role {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

/**
 * TokenStatus enum — represents the lifecycle of a queue token.
 */
export enum TokenStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * NotificationType enum — categorizes notification events.
 * Strategy Pattern: each type may trigger a different notification strategy.
 */
export enum NotificationType {
  TOKEN_GENERATED = 'TOKEN_GENERATED',
  TOKEN_READY = 'TOKEN_READY',
  SERVICE_STARTED = 'SERVICE_STARTED',
  SERVICE_COMPLETED = 'SERVICE_COMPLETED',
  QUEUE_UPDATE = 'QUEUE_UPDATE',
}
