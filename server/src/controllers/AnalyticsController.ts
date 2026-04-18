import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AnalyticsService } from '../services/AnalyticsService';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor(analyticsService: AnalyticsService) {
    this.analyticsService = analyticsService;
  }

  getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const stats = await this.analyticsService.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getServiceStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const stats = await this.analyticsService.getServiceStatistics();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
