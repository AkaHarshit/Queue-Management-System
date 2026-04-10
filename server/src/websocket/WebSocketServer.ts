import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { ConfigManager } from '../config/config';

/**
 * WebSocketServer — Observer Pattern
 *
 * Manages real-time WebSocket connections.
 * Clients subscribe to rooms (user-specific, service-specific).
 * Server broadcasts events when queue state changes.
 */
export class WebSocketServer {
  private io: SocketServer;

  constructor(httpServer: HttpServer) {
    const config = ConfigManager.getInstance();
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
      },
    });

    this.setupHandlers();
  }

  /** Get the Socket.IO server instance */
  public getIO(): SocketServer {
    return this.io;
  }

  /** Set up WebSocket event handlers */
  private setupHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      // Subscribe to user-specific notifications
      socket.on('join_user_room', (userId: number) => {
        socket.join(`user_${userId}`);
        console.log(`[WebSocket] User ${userId} joined room user_${userId}`);
      });

      // Subscribe to service-specific queue updates
      socket.on('join_service_room', (serviceId: number) => {
        socket.join(`service_${serviceId}`);
        console.log(`[WebSocket] Client joined service room service_${serviceId}`);
      });

      // Leave service room
      socket.on('leave_service_room', (serviceId: number) => {
        socket.leave(`service_${serviceId}`);
      });

      socket.on('disconnect', () => {
        console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      });
    });
  }
}
