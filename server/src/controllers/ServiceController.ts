import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ServiceService } from '../services/ServiceService';

/** Helper to safely parse route param */
function paramToInt(val: string | string[]): number {
  return parseInt(Array.isArray(val) ? val[0] : val, 10);
}

/**
 * ServiceController — REST API Controller
 *
 * SRP: Only handles HTTP request/response for service CRUD.
 */
export class ServiceController {
  private serviceService: ServiceService;

  constructor(serviceService: ServiceService) {
    this.serviceService = serviceService;
  }

  /** GET /api/services */
  getAllServices = async (req: Request, res: Response): Promise<void> => {
    try {
      const services = this.serviceService.getAllServices();
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /** GET /api/services/active */
  getActiveServices = async (req: Request, res: Response): Promise<void> => {
    try {
      const services = this.serviceService.getActiveServices();
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /** GET /api/services/:id */
  getServiceById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = paramToInt(req.params.id);
      const service = this.serviceService.getServiceById(id);
      if (!service) {
        res.status(404).json({ error: 'Service not found.' });
        return;
      }
      res.json(service);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /** POST /api/services */
  createService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, description, estimatedDurationMinutes, staffId } = req.body;
      if (!name || !estimatedDurationMinutes) {
        res.status(400).json({ error: 'Name and estimated duration are required.' });
        return;
      }
      const service = this.serviceService.createService({
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

  /** PUT /api/services/:id */
  updateService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = paramToInt(req.params.id);
      const service = this.serviceService.updateService(id, req.body);
      if (!service) {
        res.status(404).json({ error: 'Service not found.' });
        return;
      }
      res.json(service);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /** DELETE /api/services/:id */
  deleteService = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = paramToInt(req.params.id);
      const deleted = this.serviceService.deleteService(id);
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
