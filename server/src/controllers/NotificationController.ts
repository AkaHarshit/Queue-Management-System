import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { NotificationService } from '../services/NotificationService';

function paramToInt(val: string | string[]): number {
  return parseInt(Array.isArray(val) ? val[0] : val, 10);
}

export class NotificationController {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const notifications = await this.notificationService.getNotificationsForUser(req.user!.userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getUnreadNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const notifications = await this.notificationService.getUnreadNotifications(req.user!.userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = paramToInt(req.params.id);
      await this.notificationService.markAsRead(id);
      res.json({ message: 'Notification marked as read.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await this.notificationService.markAllAsRead(req.user!.userId);
      res.json({ message: 'All notifications marked as read.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
