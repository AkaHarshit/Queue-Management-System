import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { Role } from '../models/enums';

/**
 * Role Middleware — Role-Based Access Control (RBAC)
 *
 * Restricts route access based on user roles.
 * OCP: New roles can be added to the Role enum without modifying this middleware.
 */
export function roleMiddleware(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      res.status(403).json({ error: 'Insufficient permissions.' });
      return;
    }

    next();
  };
}
