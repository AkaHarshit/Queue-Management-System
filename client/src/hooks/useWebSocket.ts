import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const WS_URL = 'http://localhost:3001';

/**
 * useWebSocket — Custom Hook for real-time WebSocket connectivity.
 *
 * Automatically connects to the server, joins user + service rooms,
 * and provides listeners for queue updates and notifications.
 */
export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Create socket connection
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WebSocket] Connected:', socket.id);

      // Auto-join user room for notifications
      if (user) {
        socket.emit('join_user_room', user.id);
      }
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  /** Subscribe to a specific service queue for live updates */
  const joinServiceRoom = useCallback((serviceId: number) => {
    socketRef.current?.emit('join_service_room', serviceId);
  }, []);

  /** Unsubscribe from a service queue */
  const leaveServiceRoom = useCallback((serviceId: number) => {
    socketRef.current?.emit('leave_service_room', serviceId);
  }, []);

  /** Register a listener for queue update events */
  const onQueueUpdate = useCallback((callback: (data: any) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on('queue_update', callback);
    socket.on('global_queue_update', callback);

    return () => {
      socket.off('queue_update', callback);
      socket.off('global_queue_update', callback);
    };
  }, []);

  /** Register a listener for notification events */
  const onNotification = useCallback((callback: (data: any) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on('notification', callback);
    return () => {
      socket.off('notification', callback);
    };
  }, []);

  return {
    socket: socketRef.current,
    joinServiceRoom,
    leaveServiceRoom,
    onQueueUpdate,
    onNotification,
  };
}
