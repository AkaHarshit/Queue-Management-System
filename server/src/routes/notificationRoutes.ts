import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middleware/authMiddleware';

export function createNotificationRoutes(notificationController: NotificationController): Router {
  const router = Router();

  router.get('/', authMiddleware, notificationController.getNotifications);
  router.get('/unread', authMiddleware, notificationController.getUnreadNotifications);
  router.put('/:id/read', authMiddleware, notificationController.markAsRead);
  router.put('/read-all', authMiddleware, notificationController.markAllAsRead);

  return router;
}
