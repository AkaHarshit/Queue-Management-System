import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ServiceService } from '../services/ServiceService';

function paramToInt(val: string | string[]): number {
  return parseInt(Array.isArray(val) ? val[0] : val, 10);
}

export class ServiceController {
  private serviceService: ServiceService;

  constructor(serviceService: ServiceService) {
    this.serviceService = serviceService;
  }

  getAllServices = async (req: Request, res: Response): Promise<void> => {
    try {
      const services = await this.serviceService.getAllServices();
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getActiveServices = async (req: Request, res: Response): Promise<void> => {
    try {
      const services = await this.serviceService.getActiveServices();
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getServiceById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = paramToInt(req.params.id);
      const service = await this.serviceService.getServiceById(id);
      if (!service) {
        res.status(404).json({ error: 'Service not found.' });
        return;
      }
      res.json(service);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  createService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, description, estimatedDurationMinutes, staffId } = req.body;
      if (!name || !estimatedDurationMinutes) {
        res.status(400).json({ error: 'Name and estimated duration are required.' });
        return;
      }
      const service = await this.serviceService.createService({
        name,
        description,
        estimatedDurationMinutes,
        staffId,
      });
      res.status(201).json(service);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  updateService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = paramToInt(req.params.id);
      const service = await this.serviceService.updateService(id, req.body);
      if (!service) {
        res.status(404).json({ error: 'Service not found.' });
        return;
      }
      res.json(service);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  deleteService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = paramToInt(req.params.id);
      const deleted = await this.serviceService.deleteService(id);
      if (!deleted) {
        res.status(404).json({ error: 'Service not found.' });
        return;
      }
      res.json({ message: 'Service deleted successfully.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
