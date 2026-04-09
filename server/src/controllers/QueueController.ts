import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { QueueService } from '../services/QueueService';

/** Helper to safely parse route param */
function paramToInt(val: string | string[]): number {
  return parseInt(Array.isArray(val) ? val[0] : val, 10);
}

/**
 * QueueController — REST API Controller
 *
 * SRP: Only handles HTTP request/response for queue endpoints.
 * DIP: Depends on QueueService interface.
 */
export class QueueController {
  private queueService: QueueService;

  constructor(queueService: QueueService) {
    this.queueService = queueService;
  }

  /** POST /api/queue/join — Customer joins a queue */
  joinQueue = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { serviceId } = req.body;
      if (!serviceId) {
        res.status(400).json({ error: 'Service ID is required.' });
        return;
      }
      const result = await this.queueService.joinQueue(req.user!.userId, serviceId);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /** GET /api/queue/token/:id/status — Get token status */
  getTokenStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tokenId = paramToInt(req.params.id);
      const token = this.queueService.getTokenStatus(tokenId);
      if (!token) {
        res.status(404).json({ error: 'Token not found.' });
        return;
      }
      res.json(token);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /** DELETE /api/queue/token/:id — Cancel a token */
  cancelToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tokenId = paramToInt(req.params.id);
      const result = await this.queueService.cancelToken(tokenId, req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /** GET /api/queue/my-tokens — Customer's tokens */
  getMyTokens = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tokens = this.queueService.getCustomerTokens(req.user!.userId);
      res.json(tokens);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /** GET /api/queue/staff/tokens — Staff's assigned tokens */
  getStaffTokens = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tokens = this.queueService.getStaffTokens(req.user!.userId);
      res.json(tokens);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /** PUT /api/queue/token/:id/start — Mark token as in-progress */
  markTokenInProgress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tokenId = paramToInt(req.params.id);
      const result = await this.queueService.markTokenInProgress(tokenId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /** PUT /api/queue/token/:id/complete — Complete service */
  completeService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tokenId = paramToInt(req.params.id);
      const result = await this.queueService.completeService(tokenId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /** GET /api/queue/all — Get all queues (Admin) */
  getAllQueues = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const queues = this.queueService.getAllQueues();
      res.json(queues);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
