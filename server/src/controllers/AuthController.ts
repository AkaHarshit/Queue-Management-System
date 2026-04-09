import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

/**
 * AuthController — REST API Controller
 *
 * SRP: Only handles HTTP request/response for auth endpoints.
 * DIP: Depends on AuthService interface.
 */
export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /** POST /api/auth/register */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName, phoneNumber, role } = req.body;

      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({ error: 'Email, password, first name, and last name are required.' });
        return;
      }

      const result = await this.authService.register({
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        role,
      });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /** POST /api/auth/login */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const result = await this.authService.login(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };
}
