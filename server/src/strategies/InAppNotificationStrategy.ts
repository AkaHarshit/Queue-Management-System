import { INotificationStrategy } from '../interfaces/INotificationStrategy';
import { NotificationRepository } from '../repositories/NotificationRepository';

/**
 * InAppNotificationStrategy — Strategy Pattern (OCP)
 *
 * Persists notifications to the database for in-app display.
 * Users can view and mark them as read from their dashboard.
 */
export class InAppNotificationStrategy implements INotificationStrategy {
  public readonly channelName = 'in_app';
  private notificationRepository: NotificationRepository;

  constructor(notificationRepository: NotificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async send(userId: number, title: string, message: string, data?: Record<string, any>): Promise<void> {
    this.notificationRepository.save({
      userId,
      tokenId: data?.tokenId || null,
      notificationType: data?.type || 'QUEUE_UPDATE',
      title,
      message,
    });
  }
}
