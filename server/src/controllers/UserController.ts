import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { UserService } from '../services/UserService';

/** Helper to safely parse route param */
function paramToInt(val: string | string[]): number {
  return parseInt(Array.isArray(val) ? val[0] : val, 10);
}

/**
 * UserController — REST API Controller
 *
 * SRP: Only handles HTTP request/response for user management.
 */
export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  /** GET /api/users */
  getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const users = this.userService.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /** GET /api/users/:id */
  getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = paramToInt(req.params.id);
      const user = this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /** PUT /api/users/:id */
  updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = paramToInt(req.params.id);
      const user = await this.userService.updateUser(id, req.body);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /** DELETE /api/users/:id */
  deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = paramToInt(req.params.id);
      const deleted = this.userService.deleteUser(id);
      if (!deleted) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      res.json({ message: 'User deleted successfully.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /** GET /api/users/me — Get current user */
  getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = this.userService.getUserById(req.user!.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
