import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { Role } from '../models/enums';

export function createUserRoutes(userController: UserController): Router {
  const router = Router();

  // Current user
  router.get('/me', authMiddleware, userController.getMe);

  // Admin endpoints
  router.get('/', authMiddleware, roleMiddleware(Role.ADMIN), userController.getAllUsers);
  router.get('/:id', authMiddleware, roleMiddleware(Role.ADMIN), userController.getUserById);
  router.put('/:id', authMiddleware, roleMiddleware(Role.ADMIN), userController.updateUser);
  router.delete('/:id', authMiddleware, roleMiddleware(Role.ADMIN), userController.deleteUser);

  return router;
}
