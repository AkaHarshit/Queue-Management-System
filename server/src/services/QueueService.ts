import { TokenRepository } from '../repositories/TokenRepository';
import { QueueRepository } from '../repositories/QueueRepository';
import { ServiceRepository } from '../repositories/ServiceRepository';
import { UserRepository } from '../repositories/UserRepository';
import { TokenFactory } from '../factories/TokenFactory';
import { NotificationService } from './NotificationService';
import { TokenStatus, NotificationType } from '../models/enums';
import { DatabaseConnection } from '../config/database';

export class QueueService {
  private tokenRepository: TokenRepository;
  private queueRepository: QueueRepository;
  private serviceRepository: ServiceRepository;
  private userRepository: UserRepository;
  private tokenFactory: TokenFactory;
  private notificationService: NotificationService;

  constructor(
    tokenRepository: TokenRepository,
    queueRepository: QueueRepository,
    serviceRepository: ServiceRepository,
    userRepository: UserRepository,
    tokenFactory: TokenFactory,
    notificationService: NotificationService
  ) {
    this.tokenRepository = tokenRepository;
    this.queueRepository = queueRepository;
    this.serviceRepository = serviceRepository;
    this.userRepository = userRepository;
    this.tokenFactory = tokenFactory;
    this.notificationService = notificationService;
  }

  async joinQueue(userId: number, serviceId: number): Promise<any> {
    const service = await this.serviceRepository.findById(serviceId);
    if (!service || !service.is_active) {
      throw new Error('Service not available');
    }

    const customer = await this.userRepository.findCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Customer record not found');
    }

    const existingToken = await this.tokenRepository.findActiveTokenForCustomer(customer.id, serviceId);
    if (existingToken) {
      throw new Error('You already have an active token for this service');
    }

    const token = await this.tokenFactory.createToken(customer.id, serviceId);

    const queue = await this.queueRepository.getOrCreateForService(serviceId);
    const activeCount = await this.queueRepository.getActiveTokenCount(queue.id);
    await this.queueRepository.addTokenToQueue(queue.id, token.id, activeCount);

    const estimatedWait = activeCount * service.estimated_duration_minutes;
    await this.tokenRepository.update(token.id, {
      queuePosition: activeCount,
      estimatedWaitTimeMinutes: estimatedWait,
    });

    await this.notificationService.sendNotification(
      userId,
      'Token Generated',
      `Your token #${token.token_number} has been generated for ${service.name}. Position: ${activeCount}, Est. wait: ${estimatedWait} min.`,
      { tokenId: token.id, type: NotificationType.TOKEN_GENERATED }
    );

    return await this.tokenRepository.findById(token.id);
  }

  async getTokenStatus(tokenId: number): Promise<any | null> {
    return await this.tokenRepository.findById(tokenId);
  }

  async getCustomerTokens(userId: number): Promise<any[]> {
    const customer = await this.userRepository.findCustomerByUserId(userId);
    if (!customer) return [];
    return await this.tokenRepository.findByCustomerId(customer.id);
  }

  async getStaffTokens(userId: number): Promise<any[]> {
    const staff = await this.userRepository.findStaffByUserId(userId);
    if (!staff || !staff.service_id) return [];
    return await this.tokenRepository.findActiveTokensByService(staff.service_id);
  }

  async cancelToken(tokenId: number, userId: number): Promise<any> {
    const token = await this.tokenRepository.findById(tokenId);
    if (!token) throw new Error('Token not found');
    if (token.status !== TokenStatus.WAITING) {
      throw new Error('Can only cancel tokens in WAITING status');
    }

    await this.tokenRepository.update(tokenId, {
      status: TokenStatus.CANCELLED,
      cancelledAt: new Date().toISOString(),
    });

    await this.queueRepository.removeTokenFromQueue(tokenId);
    await this.recalculateQueuePositions(token.service_id);

    return await this.tokenRepository.findById(tokenId);
  }

  async markTokenInProgress(tokenId: number): Promise<any> {
    const token = await this.tokenRepository.findById(tokenId);
    if (!token) throw new Error('Token not found');
    if (token.status !== TokenStatus.WAITING) {
      throw new Error('Can only start tokens in WAITING status');
    }

    await this.tokenRepository.update(tokenId, {
      status: TokenStatus.IN_PROGRESS,
      startedAt: new Date().toISOString(),
    });

    const customerUserId = await this.getCustomerUserId(token.customer_id);
    if (customerUserId) {
      await this.notificationService.sendNotification(
        customerUserId,
        'Service Started',
        `Your token #${token.token_number} is now being served!`,
        { tokenId, type: NotificationType.SERVICE_STARTED }
      );
    }

    return await this.tokenRepository.findById(tokenId);
  }

  async completeService(tokenId: number): Promise<any> {
    const token = await this.tokenRepository.findById(tokenId);
    if (!token) throw new Error('Token not found');
    if (token.status !== TokenStatus.IN_PROGRESS) {
      throw new Error('Can only complete tokens in IN_PROGRESS status');
    }

    await this.tokenRepository.update(tokenId, {
      status: TokenStatus.COMPLETED,
      completedAt: new Date().toISOString(),
    });

    await this.queueRepository.removeTokenFromQueue(tokenId);
    await this.recalculateQueuePositions(token.service_id);

    const customerUserId = await this.getCustomerUserId(token.customer_id);
    if (customerUserId) {
      await this.notificationService.sendNotification(
        customerUserId,
        'Service Completed',
        `Your service for token #${token.token_number} has been completed. Thank you!`,
        { tokenId, type: NotificationType.SERVICE_COMPLETED }
      );
    }

    return await this.tokenRepository.findById(tokenId);
  }

  async getAllQueues(): Promise<any[]> {
    const queues = await this.queueRepository.findAll();
    return Promise.all(queues.map(async (queue: any) => {
      const tokens = await this.queueRepository.getQueueTokens(queue.id);
      return {
        ...queue,
        activeTokens: tokens.length,
        tokens,
      };
    }));
  }

  private async recalculateQueuePositions(serviceId: number): Promise<void> {
    const queue = await this.queueRepository.findByServiceId(serviceId);
    if (!queue) return;

    const queueTokens = await this.queueRepository.getQueueTokens(queue.id);
    const service = await this.serviceRepository.findById(serviceId);

    for (let index = 0; index < queueTokens.length; index++) {
      const qt = queueTokens[index];
      const waitTime = index * (service?.estimated_duration_minutes || 15);
      await this.tokenRepository.update(qt.token_id, {
        queuePosition: index + 1,
        estimatedWaitTimeMinutes: waitTime,
      });
    }
  }

  private async getCustomerUserId(customerId: number): Promise<number | null> {
    const pool = DatabaseConnection.getInstance().getPool();
    const res = await pool.query('SELECT user_id FROM customers WHERE id = $1', [customerId]);
    return res.rows[0]?.user_id || null;
  }
}
