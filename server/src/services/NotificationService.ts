import { INotificationStrategy } from '../interfaces/INotificationStrategy';
import { NotificationRepository } from '../repositories/NotificationRepository';

/**
 * NotificationService — Service Layer Pattern (SRP) + Strategy Pattern (OCP)
 *
 * SRP: Only responsible for orchestrating notification delivery.
 * OCP: New notification channels can be added by registering new strategies
 *      without modifying this class.
 * DIP: Depends on INotificationStrategy interface.
 */
export class NotificationService {
  private strategies: INotificationStrategy[] = [];
  private notificationRepository: NotificationRepository;

  constructor(notificationRepository: NotificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  /**
   * Register a notification strategy (OCP — open for extension).
   * New channels are added by calling this method, not by modifying existing code.
   */
  public registerStrategy(strategy: INotificationStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * Send notification through all registered strategies.
   */
  async sendNotification(
    userId: number,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    for (const strategy of this.strategies) {
      try {
        await strategy.send(userId, title, message, data);
      } catch (error) {
        console.error(`[NotificationService] Failed to send via ${strategy.channelName}:`, error);
      }
    }
  }

  /** Get notifications for a user */
  getNotificationsForUser(userId: number): any[] {
    return this.notificationRepository.findByUserId(userId);
  }

  /** Get unread notifications for a user */
  getUnreadNotifications(userId: number): any[] {
    return this.notificationRepository.findUnreadByUserId(userId);
  }

  /** Mark a notification as read */
  markAsRead(notificationId: number): void {
    this.notificationRepository.markAsRead(notificationId);
  }

  /** Mark all notifications as read for a user */
  markAllAsRead(userId: number): void {
    this.notificationRepository.markAllAsRead(userId);
  }
}
