/**
 * INotificationStrategy — Strategy Pattern (OCP)
 *
 * Defines a common interface for notification delivery channels.
 * New channels (Email, SMS, Push) can be added by implementing
 * this interface WITHOUT modifying existing notification logic.
 */
export interface INotificationStrategy {
  /** Unique identifier for this strategy */
  readonly channelName: string;

  /**
   * Send a notification through this channel.
   * @param userId - The recipient user ID
   * @param title - Notification title
   * @param message - Notification message body
   * @param data - Optional additional data (e.g., tokenId, type)
   */
  send(userId: number, title: string, message: string, data?: Record<string, any>): Promise<void>;
}
