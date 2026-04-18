import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { QueueService } from '../services/QueueService';

function paramToInt(val: string | string[]): number {
  return parseInt(Array.isArray(val) ? val[0] : val, 10);
}

export class QueueController {
  private queueService: QueueService;

  constructor(queueService: QueueService) {
    this.queueService = queueService;
  }

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

  getTokenStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tokenId = paramToInt(req.params.id);
      const token = await this.queueService.getTokenStatus(tokenId);
      if (!token) {
        res.status(404).json({ error: 'Token not found.' });
        return;
      }
      res.json(token);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  cancelToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tokenId = paramToInt(req.params.id);
      const result = await this.queueService.cancelToken(tokenId, req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getMyTokens = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tokens = await this.queueService.getCustomerTokens(req.user!.userId);
      res.json(tokens);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getStaffTokens = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tokens = await this.queueService.getStaffTokens(req.user!.userId);
      res.json(tokens);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  markTokenInProgress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tokenId = paramToInt(req.params.id);
      const result = await this.queueService.markTokenInProgress(tokenId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  completeService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tokenId = paramToInt(req.params.id);
      const result = await this.queueService.completeService(tokenId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getAllQueues = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const queues = await this.queueService.getAllQueues();
      res.json(queues);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
