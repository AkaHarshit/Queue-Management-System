import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { Role } from '../models/enums';

export function createAnalyticsRoutes(analyticsController: AnalyticsController): Router {
  const router = Router();

  router.get('/dashboard', authMiddleware, roleMiddleware(Role.ADMIN), analyticsController.getDashboardStats);
  router.get('/services', authMiddleware, roleMiddleware(Role.ADMIN, Role.STAFF), analyticsController.getServiceStatistics);

  return router;
}
