import { UserRepository } from '../repositories/UserRepository';
import bcrypt from 'bcryptjs';

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async getAllUsers(): Promise<any[]> {
    const users = await this.userRepository.findAll();
    return users.map(this.sanitizeUser);
  }

  async getUserById(id: number): Promise<any | null> {
    const user = await this.userRepository.findUserWithDetails(id);
    return user ? this.sanitizeUser(user) : null;
  }

  async getUsersByRole(role: string): Promise<any[]> {
    const users = await this.userRepository.findByRole(role);
    return users.map(this.sanitizeUser);
  }

  async updateUser(id: number, data: any): Promise<any | null> {
    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 12);
      delete data.password;
    }
    const updated = await this.userRepository.update(id, data);
    return updated ? this.sanitizeUser(updated) : null;
  }

  async deleteUser(id: number): Promise<boolean> {
    return await this.userRepository.delete(id);
  }

  async getStaffByServiceId(serviceId: number): Promise<any[]> {
    return await this.userRepository.findStaffByServiceId(serviceId);
  }

  private sanitizeUser(user: any): any {
    const { password_hash, passwordHash, ...safe } = user;
    return safe;
  }
}
