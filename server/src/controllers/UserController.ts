import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { UserService } from '../services/UserService';

function paramToInt(val: string | string[]): number {
  return parseInt(Array.isArray(val) ? val[0] : val, 10);
}

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const users = await this.userService.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = paramToInt(req.params.id);
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

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

  deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = paramToInt(req.params.id);
      const deleted = await this.userService.deleteUser(id);
      if (!deleted) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      res.json({ message: 'User deleted successfully.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await this.userService.getUserById(req.user!.userId);
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
