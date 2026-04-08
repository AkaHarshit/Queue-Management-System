import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { ConfigManager } from '../config/config';
import { Role } from '../models/enums';

/**
 * AuthService — Service Layer Pattern (SRP)
 *
 * SRP: Only responsible for authentication and authorization logic.
 * DIP: Depends on UserRepository interface, not concrete DB.
 */
export class AuthService {
  private userRepository: UserRepository;
  private config: ConfigManager;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
    this.config = ConfigManager.getInstance();
  }

  /**
   * Register a new user.
   * Creates role-specific sub-record (customer/staff/admin).
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role?: Role;
  }): Promise<any> {
    // Check if email already exists
    const existing = this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);
    const role = data.role || Role.CUSTOMER;

    // Create user
    const user = this.userRepository.save({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber || null,
      role,
    });

    // Create role-specific record
    if (role === Role.CUSTOMER) {
      this.userRepository.createCustomer(user.id);
    } else if (role === Role.STAFF) {
      this.userRepository.createStaff(user.id);
    } else if (role === Role.ADMIN) {
      this.userRepository.createAdmin(user.id);
    }

    // Generate JWT
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Authenticate a user with email and password.
   */
  async login(email: string, password: string): Promise<any> {
    const user = this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    const userDetails = this.userRepository.findUserWithDetails(user.id);

    return {
      user: this.sanitizeUser(userDetails),
      token,
    };
  }

  /** Generate a JWT token */
  private generateToken(user: any): string {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      this.config.jwtSecret,
      { expiresIn: 86400 } // 24 hours in seconds
    );
  }

  /** Remove sensitive fields from user object */
  private sanitizeUser(user: any): any {
    const { password_hash, passwordHash, ...safe } = user;
    return safe;
  }
}
