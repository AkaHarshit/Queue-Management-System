import { Router } from 'express';
import { QueueController } from '../controllers/QueueController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { Role } from '../models/enums';

export function createQueueRoutes(queueController: QueueController): Router {
  const router = Router();

  // Customer endpoints
  router.post('/join', authMiddleware, roleMiddleware(Role.CUSTOMER), queueController.joinQueue);
  router.get('/my-tokens', authMiddleware, roleMiddleware(Role.CUSTOMER), queueController.getMyTokens);
  router.delete('/token/:id', authMiddleware, roleMiddleware(Role.CUSTOMER), queueController.cancelToken);

  // Token status (accessible by all authenticated users)
  router.get('/token/:id/status', authMiddleware, queueController.getTokenStatus);

  // Staff endpoints
  router.get('/staff/tokens', authMiddleware, roleMiddleware(Role.STAFF), queueController.getStaffTokens);
  router.put('/token/:id/start', authMiddleware, roleMiddleware(Role.STAFF), queueController.markTokenInProgress);
  router.put('/token/:id/complete', authMiddleware, roleMiddleware(Role.STAFF), queueController.completeService);

  // Admin endpoints
  router.get('/all', authMiddleware, roleMiddleware(Role.ADMIN), queueController.getAllQueues);

  return router;
}
