import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AnalyticsService } from '../services/AnalyticsService';

/**
 * AnalyticsController — REST API Controller
 *
 * SRP: Only handles HTTP request/response for analytics endpoints.
 */
export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor(analyticsService: AnalyticsService) {
    this.analyticsService = analyticsService;
  }

  /** GET /api/analytics/dashboard */
  getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const stats = this.analyticsService.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /** GET /api/analytics/services */
  getServiceStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const stats = this.analyticsService.getServiceStatistics();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
