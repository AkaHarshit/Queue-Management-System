import { TokenRepository } from '../repositories/TokenRepository';

/**
 * TokenFactory — Factory Pattern
 *
 * Encapsulates token creation logic including auto-numbering.
 * SRP: Only responsible for constructing token objects.
 * OCP: Can be extended for different token formats without modifying existing code.
 */
export class TokenFactory {
  private tokenRepository: TokenRepository;

  constructor(tokenRepository: TokenRepository) {
    this.tokenRepository = tokenRepository;
  }

  /**
   * Create a new token for a given service and customer.
   * Automatically determines the next token number for today.
   *
   * @param customerId - The customer's ID in the customers table
   * @param serviceId - The service ID being requested
   * @returns The created token record from the database
   */
  public createToken(customerId: number, serviceId: number): any {
    // Get next token number for this service today
    const lastNumber = this.tokenRepository.findLastTokenNumber(serviceId);
    const tokenNumber = lastNumber + 1;

    // Calculate queue position based on active tokens
    const activeTokens = this.tokenRepository.findActiveTokensByService(serviceId);
    const queuePosition = activeTokens.length + 1;

    // Save and return the new token
    return this.tokenRepository.save({
      tokenNumber,
      customerId,
      serviceId,
      queuePosition,
      status: 'WAITING',
      estimatedWaitTimeMinutes: 0, // Will be calculated by QueueService
    });
  }
}
