import { UserRepository } from '../repositories/UserRepository';
import bcrypt from 'bcryptjs';

/**
 * UserService — Service Layer Pattern (SRP)
 *
 * SRP: Only responsible for user management (CRUD).
 * DIP: Depends on UserRepository interface.
 */
export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  getAllUsers(): any[] {
    return this.userRepository.findAll().map(this.sanitizeUser);
  }

  getUserById(id: number): any | null {
    const user = this.userRepository.findUserWithDetails(id);
    return user ? this.sanitizeUser(user) : null;
  }

  getUsersByRole(role: string): any[] {
    return this.userRepository.findByRole(role).map(this.sanitizeUser);
  }

  async updateUser(id: number, data: any): Promise<any | null> {
    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 12);
      delete data.password;
    }
    const updated = this.userRepository.update(id, data);
    return updated ? this.sanitizeUser(updated) : null;
  }

  deleteUser(id: number): boolean {
    return this.userRepository.delete(id);
  }

  getStaffByServiceId(serviceId: number): any[] {
    return this.userRepository.findStaffByServiceId(serviceId);
  }

  private sanitizeUser(user: any): any {
    const { password_hash, passwordHash, ...safe } = user;
    return safe;
  }
}
