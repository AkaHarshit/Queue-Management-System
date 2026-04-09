import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { NotificationService } from '../services/NotificationService';

/** Helper to safely parse route param */
function paramToInt(val: string | string[]): number {
  return parseInt(Array.isArray(val) ? val[0] : val, 10);
}

/**
 * NotificationController — REST API Controller
 *
 * SRP: Only handles HTTP request/response for notification endpoints.
 */
export class NotificationController {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  /** GET /api/notifications */
  getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const notifications = this.notificationService.getNotificationsForUser(req.user!.userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /** GET /api/notifications/unread */
  getUnreadNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const notifications = this.notificationService.getUnreadNotifications(req.user!.userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /** PUT /api/notifications/:id/read */
  markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = paramToInt(req.params.id);
      this.notificationService.markAsRead(id);
      res.json({ message: 'Notification marked as read.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /** PUT /api/notifications/read-all */
  markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      this.notificationService.markAllAsRead(req.user!.userId);
      res.json({ message: 'All notifications marked as read.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
