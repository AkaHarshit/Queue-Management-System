import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { ConfigManager } from './config/config';
import { DatabaseConnection } from './config/database';

// Repositories
import { UserRepository } from './repositories/UserRepository';
import { TokenRepository } from './repositories/TokenRepository';
import { QueueRepository } from './repositories/QueueRepository';
import { ServiceRepository } from './repositories/ServiceRepository';
import { NotificationRepository } from './repositories/NotificationRepository';
import { ServiceStatisticsRepository } from './repositories/ServiceStatisticsRepository';

// Factory
import { TokenFactory } from './factories/TokenFactory';

// Strategies
import { WebSocketNotificationStrategy } from './strategies/WebSocketNotificationStrategy';
import { InAppNotificationStrategy } from './strategies/InAppNotificationStrategy';

// Services
import { AuthService } from './services/AuthService';
import { UserService } from './services/UserService';
import { ServiceService } from './services/ServiceService';
import { NotificationService } from './services/NotificationService';
import { QueueService } from './services/QueueService';
import { AnalyticsService } from './services/AnalyticsService';

// Controllers
import { AuthController } from './controllers/AuthController';
import { QueueController } from './controllers/QueueController';
import { ServiceController } from './controllers/ServiceController';
import { UserController } from './controllers/UserController';
import { AnalyticsController } from './controllers/AnalyticsController';
import { NotificationController } from './controllers/NotificationController';

// Routes
import { createAuthRoutes } from './routes/authRoutes';
import { createQueueRoutes } from './routes/queueRoutes';
import { createServiceRoutes } from './routes/serviceRoutes';
import { createUserRoutes } from './routes/userRoutes';
import { createAnalyticsRoutes } from './routes/analyticsRoutes';
import { createNotificationRoutes } from './routes/notificationRoutes';

// WebSocket
import { WebSocketServer } from './websocket/WebSocketServer';

import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// ─── Bootstrap Application ──────────────────────────────────────────────────

const config = ConfigManager.getInstance();
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

// Rate Limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many login attempts, please try again after 15 minutes' }
});

// ─── Initialize Database (Singleton) ────────────────────────────────────────
const db = DatabaseConnection.getInstance();

// ─── Initialize Repositories (DIP — all services depend on interfaces) ──────
const userRepository = new UserRepository();
const tokenRepository = new TokenRepository();
const queueRepository = new QueueRepository();
const serviceRepository = new ServiceRepository();
const notificationRepository = new NotificationRepository();
const statisticsRepository = new ServiceStatisticsRepository();

// ─── Initialize Factory (Factory Pattern) ───────────────────────────────────
const tokenFactory = new TokenFactory(tokenRepository);

// ─── Initialize WebSocket (Observer Pattern) ────────────────────────────────
const wsServer = new WebSocketServer(httpServer);

// ─── Initialize Strategies (Strategy Pattern — OCP) ─────────────────────────
const wsStrategy = new WebSocketNotificationStrategy();
wsStrategy.setSocketServer(wsServer.getIO());
const inAppStrategy = new InAppNotificationStrategy(notificationRepository);

// ─── Initialize Services (Service Layer — SRP) ─────────────────────────────
const notificationService = new NotificationService(notificationRepository);
notificationService.registerStrategy(wsStrategy);    // Register WebSocket channel
notificationService.registerStrategy(inAppStrategy);  // Register In-App channel

const authService = new AuthService(userRepository);
const userService = new UserService(userRepository);
const serviceService = new ServiceService(serviceRepository, queueRepository);
const queueService = new QueueService(
  tokenRepository, queueRepository, serviceRepository,
  userRepository, tokenFactory, notificationService, wsStrategy
);
const analyticsService = new AnalyticsService(tokenRepository, serviceRepository, queueRepository);

// ─── Initialize Controllers ─────────────────────────────────────────────────
const authController = new AuthController(authService);
const queueController = new QueueController(queueService);
const serviceController = new ServiceController(serviceService);
const userController = new UserController(userService);
const analyticsController = new AnalyticsController(analyticsService);
const notificationController = new NotificationController(notificationService);

// ─── Register Routes ────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, createAuthRoutes(authController));
app.use('/api/queue', createQueueRoutes(queueController));
app.use('/api/services', createServiceRoutes(serviceController));
app.use('/api/users', createUserRoutes(userController));
app.use('/api/analytics', createAnalyticsRoutes(analyticsController));
app.use('/api/notifications', createNotificationRoutes(notificationController));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Seed Data ──────────────────────────────────────────────────────────────
async function seedData(): Promise<void> {
  const existingAdmin = userRepository.findByEmail('admin@queue.com');
  if (existingAdmin) {
    console.log('[Seed] Data already exists, skipping seed.');
    return;
  }

  console.log('[Seed] Seeding demo data...');

  const adminHash = await bcrypt.hash('admin123', 12);
  const staffHash = await bcrypt.hash('staff123', 12);
  const customerHash = await bcrypt.hash('customer123', 12);

  // Create Admin
  const adminUser = userRepository.save({
    email: 'admin@queue.com', passwordHash: adminHash,
    firstName: 'Admin', lastName: 'User', role: 'ADMIN',
  });
  userRepository.createAdmin(adminUser.id);

  // Create Staff 1
  const staff1User = userRepository.save({
    email: 'staff1@queue.com', passwordHash: staffHash,
    firstName: 'Alice', lastName: 'Smith', role: 'STAFF',
  });
  const staff1 = userRepository.createStaff(staff1User.id);

  // Create Staff 2
  const staff2User = userRepository.save({
    email: 'staff2@queue.com', passwordHash: staffHash,
    firstName: 'Bob', lastName: 'Johnson', role: 'STAFF',
  });
  const staff2 = userRepository.createStaff(staff2User.id);

  // Create Services
  const service1 = serviceService.createService({
    name: 'Haircut',
    description: 'Professional haircut styling service',
    estimatedDurationMinutes: 30,
    staffId: staff1.id,
  });

  const service2 = serviceService.createService({
    name: 'Hair Styling',
    description: 'Advanced hair styling and treatment',
    estimatedDurationMinutes: 45,
    staffId: staff2.id,
  });

  const service3 = serviceService.createService({
    name: 'General Consultation',
    description: 'Medical consultation with a doctor',
    estimatedDurationMinutes: 20,
  });

  // Update staff with service assignment
  const dbInstance = db.getDb();
  dbInstance.prepare('UPDATE staff SET service_id = ? WHERE id = ?').run(service1.id, staff1.id);
  dbInstance.prepare('UPDATE staff SET service_id = ? WHERE id = ?').run(service2.id, staff2.id);

  // Create demo customers
  const cust1User = userRepository.save({
    email: 'john@example.com', passwordHash: customerHash,
    firstName: 'John', lastName: 'Doe', phoneNumber: '1234567890', role: 'CUSTOMER',
  });
  userRepository.createCustomer(cust1User.id);

  const cust2User = userRepository.save({
    email: 'jane@example.com', passwordHash: customerHash,
    firstName: 'Jane', lastName: 'Wilson', phoneNumber: '0987654321', role: 'CUSTOMER',
  });
  userRepository.createCustomer(cust2User.id);

  console.log('[Seed] Demo data seeded successfully!');
  console.log('[Seed] Accounts:');
  console.log('  Admin:    admin@queue.com / admin123');
  console.log('  Staff 1:  staff1@queue.com / staff123');
  console.log('  Staff 2:  staff2@queue.com / staff123');
  console.log('  Customer: john@example.com / customer123');
  console.log('  Customer: jane@example.com / customer123');
}

// ─── Start Server ────────────────────────────────────────────────────────────
seedData().then(() => {
  httpServer.listen(config.port, () => {
    console.log(`\n🚀 Queue Management Server running on http://localhost:${config.port}`);
    console.log(`📡 WebSocket server active`);
    console.log(`🔗 API: http://localhost:${config.port}/api`);
  });
});
