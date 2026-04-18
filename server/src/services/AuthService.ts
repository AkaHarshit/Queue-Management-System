import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { ConfigManager } from '../config/config';
import { Role } from '../models/enums';

export class AuthService {
  private userRepository: UserRepository;
  private config: ConfigManager;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
    this.config = ConfigManager.getInstance();
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role?: Role;
  }): Promise<any> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const role = data.role || Role.CUSTOMER;

    const user = await this.userRepository.save({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber || null,
      role,
    });

    if (role === Role.CUSTOMER) {
      await this.userRepository.createCustomer(user.id);
    } else if (role === Role.STAFF) {
      await this.userRepository.createStaff(user.id);
    } else if (role === Role.ADMIN) {
      await this.userRepository.createAdmin(user.id);
    }

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    const userDetails = await this.userRepository.findUserWithDetails(user.id);

    return {
      user: this.sanitizeUser(userDetails),
      token,
    };
  }

  private generateToken(user: any): string {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      this.config.jwtSecret,
      { expiresIn: 86400 }
    );
  }

  private sanitizeUser(user: any): any {
    const { password_hash, passwordHash, ...safe } = user;
    return safe;
  }
}
