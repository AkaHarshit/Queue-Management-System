import { INotificationStrategy } from '../interfaces/INotificationStrategy';
import { NotificationRepository } from '../repositories/NotificationRepository';

export class NotificationService {
  private strategies: INotificationStrategy[] = [];
  private notificationRepository: NotificationRepository;

  constructor(notificationRepository: NotificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  public registerStrategy(strategy: INotificationStrategy): void {
    this.strategies.push(strategy);
  }

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

  async getNotificationsForUser(userId: number): Promise<any[]> {
    return await this.notificationRepository.findByUserId(userId);
  }

  async getUnreadNotifications(userId: number): Promise<any[]> {
    return await this.notificationRepository.findUnreadByUserId(userId);
  }

  async markAsRead(notificationId: number): Promise<void> {
    await this.notificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }
}
