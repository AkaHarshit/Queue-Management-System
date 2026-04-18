import { TokenRepository } from '../repositories/TokenRepository';
import { ServiceRepository } from '../repositories/ServiceRepository';
import { QueueRepository } from '../repositories/QueueRepository';

export class AnalyticsService {
  private tokenRepository: TokenRepository;
  private serviceRepository: ServiceRepository;
  private queueRepository: QueueRepository;

  constructor(
    tokenRepository: TokenRepository,
    serviceRepository: ServiceRepository,
    queueRepository: QueueRepository
  ) {
    this.tokenRepository = tokenRepository;
    this.serviceRepository = serviceRepository;
    this.queueRepository = queueRepository;
  }

  async getDashboardStats(): Promise<any> {
    const todayStats = await this.tokenRepository.getTodayStats();
    const queues = await this.queueRepository.findAll();
    const services = await this.serviceRepository.findAll();

    let totalActiveTokens = 0;
    const queueDetails = await Promise.all(queues.map(async (queue: any) => {
      const tokens = await this.queueRepository.getQueueTokens(queue.id);
      totalActiveTokens += tokens.length;
      return {
        serviceId: queue.service_id,
        serviceName: queue.service_name,
        activeTokens: tokens.length,
        currentPosition: queue.current_position,
      };
    }));

    return {
      today: {
        totalTokens: todayStats?.total || 0,
        waiting: todayStats?.waiting || 0,
        inProgress: todayStats?.in_progress || 0,
        completed: todayStats?.completed || 0,
        cancelled: todayStats?.cancelled || 0,
        avgServiceTime: Math.round(todayStats?.avg_service_time || 0),
        avgWaitTime: Math.round(todayStats?.avg_wait_time || 0),
      },
      activeQueues: totalActiveTokens,
      totalServices: services.length,
      activeServices: services.filter((s: any) => s.is_active).length,
      queues: queueDetails,
    };
  }

  async getServiceStatistics(): Promise<any[]> {
    const services = await this.serviceRepository.findAll();
    return Promise.all(services.map(async (service: any) => {
      const activeTokens = await this.tokenRepository.findActiveTokensByService(service.id);
      return {
        id: service.id,
        name: service.name,
        isActive: !!service.is_active,
        estimatedDurationMinutes: service.estimated_duration_minutes,
        staffName: service.staff_first_name
          ? `${service.staff_first_name} ${service.staff_last_name}`
          : 'Unassigned',
        activeTokens: activeTokens.length,
        waitingTokens: activeTokens.filter((t: any) => t.status === 'WAITING').length,
        inProgressTokens: activeTokens.filter((t: any) => t.status === 'IN_PROGRESS').length,
      };
    }));
  }
}
