import { Router } from 'express';
import { ServiceController } from '../controllers/ServiceController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { Role } from '../models/enums';

export function createServiceRoutes(serviceController: ServiceController): Router {
  const router = Router();

  // Public endpoints
  router.get('/', serviceController.getAllServices);
  router.get('/active', serviceController.getActiveServices);
  router.get('/:id', serviceController.getServiceById);

  // Admin endpoints
  router.post('/', authMiddleware, roleMiddleware(Role.ADMIN), serviceController.createService);
  router.put('/:id', authMiddleware, roleMiddleware(Role.ADMIN), serviceController.updateService);
  router.delete('/:id', authMiddleware, roleMiddleware(Role.ADMIN), serviceController.deleteService);

  return router;
}
