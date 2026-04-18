// ApiService — Centralized HTTP client for all backend API calls
import { AuthResponse, Service, Token, DashboardStats, QueueInfo, User, Notification } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string; password: string;
    firstName: string; lastName: string;
    phoneNumber?: string; role?: string;
  }): Promise<AuthResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Services
  async getServices(): Promise<Service[]> {
    return this.request('/services');
  }

  async getActiveServices(): Promise<Service[]> {
    return this.request('/services/active');
  }

  async createService(data: Partial<Service>): Promise<Service> {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: number, data: Partial<Service>): Promise<Service> {
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: number): Promise<void> {
    return this.request(`/services/${id}`, { method: 'DELETE' });
  }

  // Queue
  async joinQueue(serviceId: number): Promise<Token> {
    return this.request('/queue/join', {
      method: 'POST',
      body: JSON.stringify({ serviceId }),
    });
  }

  async getMyTokens(): Promise<Token[]> {
    return this.request('/queue/my-tokens');
  }

  async getTokenStatus(tokenId: number): Promise<Token> {
    return this.request(`/queue/token/${tokenId}/status`);
  }

  async cancelToken(tokenId: number): Promise<Token> {
    return this.request(`/queue/token/${tokenId}`, { method: 'DELETE' });
  }

  async getStaffTokens(): Promise<Token[]> {
    return this.request('/queue/staff/tokens');
  }

  async markTokenInProgress(tokenId: number): Promise<Token> {
    return this.request(`/queue/token/${tokenId}/start`, { method: 'PUT' });
  }

  async completeService(tokenId: number): Promise<Token> {
    return this.request(`/queue/token/${tokenId}/complete`, { method: 'PUT' });
  }

  async getAllQueues(): Promise<QueueInfo[]> {
    return this.request('/queue/all');
  }

  // Users
  async getMe(): Promise<User> {
    return this.request('/users/me');
  }

  async getUsers(): Promise<User[]> {
    return this.request('/users');
  }

  async deleteUser(id: number): Promise<void> {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request('/analytics/dashboard');
  }

  async getServiceStatistics(): Promise<any[]> {
    return this.request('/analytics/services');
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return this.request('/notifications');
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    return this.request('/notifications/unread');
  }

  async markNotificationRead(id: number): Promise<void> {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsRead(): Promise<void> {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }
}

export const api = new ApiService();
