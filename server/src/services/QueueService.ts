// QueueService — Core business logic for queue management operations
import { TokenRepository } from '../repositories/TokenRepository';
import { QueueRepository } from '../repositories/QueueRepository';
import { ServiceRepository } from '../repositories/ServiceRepository';
import { UserRepository } from '../repositories/UserRepository';
import { TokenFactory } from '../factories/TokenFactory';
import { NotificationService } from './NotificationService';
import { WebSocketNotificationStrategy } from '../strategies/WebSocketNotificationStrategy';
import { TokenStatus, NotificationType } from '../models/enums';

/**
 * QueueService — Service Layer Pattern (SRP)
 *
 * SRP: Only responsible for queue management business logic.
 * DIP: Depends on repository and service interfaces.
 * Uses Factory Pattern (TokenFactory) for token creation.
 * Uses Observer Pattern (WebSocket) for real-time updates.
 */
export class QueueService {
  private tokenRepository: TokenRepository;
  private queueRepository: QueueRepository;
  private serviceRepository: ServiceRepository;
  private userRepository: UserRepository;
  private tokenFactory: TokenFactory;
  private notificationService: NotificationService;
  private wsStrategy: WebSocketNotificationStrategy;

  constructor(
    tokenRepository: TokenRepository,
    queueRepository: QueueRepository,
    serviceRepository: ServiceRepository,
    userRepository: UserRepository,
    tokenFactory: TokenFactory,
    notificationService: NotificationService,
    wsStrategy: WebSocketNotificationStrategy
  ) {
    this.tokenRepository = tokenRepository;
    this.queueRepository = queueRepository;
    this.serviceRepository = serviceRepository;
    this.userRepository = userRepository;
    this.tokenFactory = tokenFactory;
    this.notificationService = notificationService;
    this.wsStrategy = wsStrategy;
  }

  /**
   * Customer joins a queue for a specific service.
   * Sequence: validate → create token (Factory) → add to queue → notify → respond
   */
  async joinQueue(userId: number, serviceId: number): Promise<any> {
    // Validate service exists and is active
    const service = this.serviceRepository.findById(serviceId);
    if (!service || !service.is_active) {
      throw new Error('Service not available');
    }

    // Get customer record
    const customer = this.userRepository.findCustomerByUserId(userId);
    if (!customer) {
      throw new Error('Customer record not found');
    }

    // Check if customer already has an active token for this service
    const existingToken = this.tokenRepository.findActiveTokenForCustomer(customer.id, serviceId);
    if (existingToken) {
      throw new Error('You already have an active token for this service');
    }

    // Create token via Factory Pattern
    const token = this.tokenFactory.createToken(customer.id, serviceId);

    // Get or create queue and add token
    const queue = this.queueRepository.getOrCreateForService(serviceId);
    const activeCount = this.queueRepository.getActiveTokenCount(queue.id);
    this.queueRepository.addTokenToQueue(queue.id, token.id, activeCount);

    // Calculate estimated wait time
    const estimatedWait = activeCount * service.estimated_duration_minutes;
    this.tokenRepository.update(token.id, {
      queuePosition: activeCount,
      estimatedWaitTimeMinutes: estimatedWait,
    });

    // Send notification (Strategy Pattern — dispatched to all registered strategies)
    await this.notificationService.sendNotification(
      userId,
      'Token Generated',
      `Your token #${token.token_number} has been generated for ${service.name}. Position: ${activeCount}, Est. wait: ${estimatedWait} min.`,
      { tokenId: token.id, type: NotificationType.TOKEN_GENERATED }
    );

    // Broadcast queue update (Observer Pattern)
    this.wsStrategy.broadcastQueueUpdate(serviceId, {
      type: 'TOKEN_ADDED',
      tokenId: token.id,
      queueSize: activeCount + 1,
    });

    return this.tokenRepository.findById(token.id);
  }

  /** Get status of a specific token */
  getTokenStatus(tokenId: number): any | null {
    return this.tokenRepository.findById(tokenId);
  }

  /** Get all tokens for a customer */
  getCustomerTokens(userId: number): any[] {
    const customer = this.userRepository.findCustomerByUserId(userId);
    if (!customer) return [];
    return this.tokenRepository.findByCustomerId(customer.id);
  }

  /** Get all active tokens for a service (staff view) */
  getStaffTokens(userId: number): any[] {
    const staff = this.userRepository.findStaffByUserId(userId);
    if (!staff || !staff.service_id) return [];
    return this.tokenRepository.findActiveTokensByService(staff.service_id);
  }

  /** Cancel a token */
  async cancelToken(tokenId: number, userId: number): Promise<any> {
    const token = this.tokenRepository.findById(tokenId);
    if (!token) throw new Error('Token not found');
    if (token.status !== TokenStatus.WAITING) {
      throw new Error('Can only cancel tokens in WAITING status');
    }

    // Update token status
    this.tokenRepository.update(tokenId, {
      status: TokenStatus.CANCELLED,
      cancelledAt: new Date().toISOString(),
    });

    // Remove from queue
    this.queueRepository.removeTokenFromQueue(tokenId);

    // Recalculate positions for remaining tokens
    this.recalculateQueuePositions(token.service_id);

    // Broadcast update
    this.wsStrategy.broadcastQueueUpdate(token.service_id, {
      type: 'TOKEN_CANCELLED',
      tokenId,
    });

    return this.tokenRepository.findById(tokenId);
  }

  /** Staff marks a token as in-progress */
  async markTokenInProgress(tokenId: number): Promise<any> {
    const token = this.tokenRepository.findById(tokenId);
    if (!token) throw new Error('Token not found');
    if (token.status !== TokenStatus.WAITING) {
      throw new Error('Can only start tokens in WAITING status');
    }

    this.tokenRepository.update(tokenId, {
      status: TokenStatus.IN_PROGRESS,
      startedAt: new Date().toISOString(),
    });

    // Notify customer
    const customerUserId = this.getCustomerUserId(token.customer_id);

    if (customerUserId) {
      await this.notificationService.sendNotification(
        customerUserId,
        'Service Started',
        `Your token #${token.token_number} is now being served!`,
        { tokenId, type: NotificationType.SERVICE_STARTED }
      );
    }

    // Broadcast update
    this.wsStrategy.broadcastQueueUpdate(token.service_id, {
      type: 'TOKEN_IN_PROGRESS',
      tokenId,
    });

    return this.tokenRepository.findById(tokenId);
  }

  /** Staff completes a service */
  async completeService(tokenId: number): Promise<any> {
    const token = this.tokenRepository.findById(tokenId);
    if (!token) throw new Error('Token not found');
    if (token.status !== TokenStatus.IN_PROGRESS) {
      throw new Error('Can only complete tokens in IN_PROGRESS status');
    }

    this.tokenRepository.update(tokenId, {
      status: TokenStatus.COMPLETED,
      completedAt: new Date().toISOString(),
    });

    // Remove from queue
    this.queueRepository.removeTokenFromQueue(tokenId);

    // Recalculate positions
    this.recalculateQueuePositions(token.service_id);

    // Notify customer
    const customerUserId = this.getCustomerUserId(token.customer_id);
    if (customerUserId) {
      await this.notificationService.sendNotification(
        customerUserId,
        'Service Completed',
        `Your service for token #${token.token_number} has been completed. Thank you!`,
        { tokenId, type: NotificationType.SERVICE_COMPLETED }
      );
    }

    // Broadcast update
    this.wsStrategy.broadcastQueueUpdate(token.service_id, {
      type: 'TOKEN_COMPLETED',
      tokenId,
    });

    return this.tokenRepository.findById(tokenId);
  }

  /** Get all queues with their current status */
  getAllQueues(): any[] {
    const queues = this.queueRepository.findAll();
    return queues.map((queue: any) => {
      const tokens = this.queueRepository.getQueueTokens(queue.id);
      return {
        ...queue,
        activeTokens: tokens.length,
        tokens,
      };
    });
  }

  /** Recalculate queue positions after a token is removed */
  private recalculateQueuePositions(serviceId: number): void {
    const queue = this.queueRepository.findByServiceId(serviceId);
    if (!queue) return;

    const queueTokens = this.queueRepository.getQueueTokens(queue.id);
    const service = this.serviceRepository.findById(serviceId);

    queueTokens.forEach((qt: any, index: number) => {
      const waitTime = index * (service?.estimated_duration_minutes || 15);
      this.tokenRepository.update(qt.token_id, {
        queuePosition: index + 1,
        estimatedWaitTimeMinutes: waitTime,
      });
    });
  }

  /** Helper: get user_id from customer_id */
  private getCustomerUserId(customerId: number): number | null {
    const db = require('../config/database').DatabaseConnection.getInstance().getDb();
    const customer: any = db.prepare('SELECT user_id FROM customers WHERE id = ?').get(customerId);
    return customer?.user_id || null;
  }
}
