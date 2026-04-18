import { TokenRepository } from '../repositories/TokenRepository';

export class TokenFactory {
  private tokenRepository: TokenRepository;

  constructor(tokenRepository: TokenRepository) {
    this.tokenRepository = tokenRepository;
  }

  public async createToken(customerId: number, serviceId: number): Promise<any> {
    const lastNumber = await this.tokenRepository.findLastTokenNumber(serviceId);
    const tokenNumber = lastNumber + 1;

    const activeTokens = await this.tokenRepository.findActiveTokensByService(serviceId);
    const queuePosition = activeTokens.length + 1;

    return await this.tokenRepository.save({
      tokenNumber,
      customerId,
      serviceId,
      queuePosition,
      status: 'WAITING',
      estimatedWaitTimeMinutes: 0,
    });
  }
}
