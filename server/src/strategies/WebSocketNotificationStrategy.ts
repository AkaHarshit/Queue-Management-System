import { INotificationStrategy } from '../interfaces/INotificationStrategy';
import { Server as SocketServer } from 'socket.io';

/**
 * WebSocketNotificationStrategy — Strategy Pattern (OCP)
 *
 * Delivers notifications via WebSocket for real-time updates.
 * Implements INotificationStrategy so it can be swapped with other channels.
 */
export class WebSocketNotificationStrategy implements INotificationStrategy {
  public readonly channelName = 'websocket';
  private io: SocketServer | null = null;

  /** Set the Socket.IO server instance */
  public setSocketServer(io: SocketServer): void {
    this.io = io;
  }

  async send(userId: number, title: string, message: string, data?: Record<string, any>): Promise<void> {
    if (!this.io) {
      console.warn('[WebSocketStrategy] Socket.IO not initialized, skipping notification');
      return;
    }

    // Emit to user-specific room
    this.io.to(`user_${userId}`).emit('notification', {
      title,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /** Broadcast a queue update to all connected clients */
  public broadcastQueueUpdate(serviceId: number, data: any): void {
    if (!this.io) return;
    this.io.to(`service_${serviceId}`).emit('queue_update', data);
    this.io.emit('global_queue_update', { serviceId, ...data });
  }
}
