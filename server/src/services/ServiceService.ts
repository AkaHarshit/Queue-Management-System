import { ServiceRepository } from '../repositories/ServiceRepository';
import { QueueRepository } from '../repositories/QueueRepository';

export class ServiceService {
  private serviceRepository: ServiceRepository;
  private queueRepository: QueueRepository;

  constructor(serviceRepository: ServiceRepository, queueRepository: QueueRepository) {
    this.serviceRepository = serviceRepository;
    this.queueRepository = queueRepository;
  }

  async getAllServices(): Promise<any[]> {
    return await this.serviceRepository.findAll();
  }

  async getActiveServices(): Promise<any[]> {
    return await this.serviceRepository.findByIsActive(true);
  }

  async getServiceById(id: number): Promise<any | null> {
    return await this.serviceRepository.findById(id);
  }

  async createService(data: {
    name: string;
    description?: string;
    estimatedDurationMinutes: number;
    staffId?: number;
  }): Promise<any> {
    const service = await this.serviceRepository.save(data);
    await this.queueRepository.getOrCreateForService(service.id);
    return service;
  }

  async updateService(id: number, data: any): Promise<any | null> {
    return await this.serviceRepository.update(id, data);
  }

  async deleteService(id: number): Promise<boolean> {
    return await this.serviceRepository.delete(id);
  }

  async assignStaff(serviceId: number, staffId: number | null): Promise<any | null> {
    return await this.serviceRepository.update(serviceId, { staffId });
  }
}
