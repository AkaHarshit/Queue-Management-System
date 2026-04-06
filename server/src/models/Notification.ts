import { NotificationType } from './enums';

/**
 * Notification — Represents a notification sent to a user about token events.
 *
 * SRP: Only manages notification data.
 * Delivered via Strategy Pattern (WebSocket, InApp, etc.).
 */
export class Notification {
  public id: number;
  public tokenId: number | null;
  public userId: number;
  public notificationType: NotificationType;
  public title: string;
  public message: string;
  public isRead: boolean;
  public sentAt: string;
  public readAt: string | null;

  constructor(data: Partial<Notification> & { userId: number; notificationType: NotificationType; title: string; message: string }) {
    this.id = data.id ?? 0;
    this.tokenId = data.tokenId ?? null;
    this.userId = data.userId;
    this.notificationType = data.notificationType;
    this.title = data.title;
    this.message = data.message;
    this.isRead = data.isRead ?? false;
    this.sentAt = data.sentAt ?? new Date().toISOString();
    this.readAt = data.readAt ?? null;
  }
}
