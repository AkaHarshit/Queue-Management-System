import { ServiceRepository } from '../repositories/ServiceRepository';
import { QueueRepository } from '../repositories/QueueRepository';

/**
 * ServiceService — Service Layer Pattern (SRP)
 *
 * SRP: Only responsible for service management business logic.
 * DIP: Depends on repository interfaces.
 */
export class ServiceService {
  private serviceRepository: ServiceRepository;
  private queueRepository: QueueRepository;

  constructor(serviceRepository: ServiceRepository, queueRepository: QueueRepository) {
    this.serviceRepository = serviceRepository;
    this.queueRepository = queueRepository;
  }

  getAllServices(): any[] {
    return this.serviceRepository.findAll();
  }

  getActiveServices(): any[] {
    return this.serviceRepository.findByIsActive(true);
  }

  getServiceById(id: number): any | null {
    return this.serviceRepository.findById(id);
  }

  createService(data: {
    name: string;
    description?: string;
    estimatedDurationMinutes: number;
    staffId?: number;
  }): any {
    const service = this.serviceRepository.save(data);
    // Also create a queue for this service
    this.queueRepository.getOrCreateForService(service.id);
    return service;
  }

  updateService(id: number, data: any): any | null {
    return this.serviceRepository.update(id, data);
  }

  deleteService(id: number): boolean {
    return this.serviceRepository.delete(id);
  }

  assignStaff(serviceId: number, staffId: number | null): any | null {
    return this.serviceRepository.update(serviceId, { staffId });
  }
}
