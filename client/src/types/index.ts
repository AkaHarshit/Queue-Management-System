export enum Role {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export enum TokenStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: Role;
  created_at: string;
  details?: {
    id: number;
    user_id: number;
    service_id?: number;
    is_available?: boolean;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  estimated_duration_minutes: number;
  is_active: boolean;
  staff_id?: number;
  staff_first_name?: string;
  staff_last_name?: string;
}

export interface Token {
  id: number;
  token_number: number;
  status: TokenStatus;
  customer_id: number;
  service_id: number;
  queue_position: number;
  estimated_wait_time_minutes: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  service_name?: string;
  customer_first_name?: string;
  customer_last_name?: string;
}

export interface QueueInfo {
  id: number;
  service_id: number;
  service_name: string;
  current_position: number;
  total_tokens_today: number;
  activeTokens: number;
  tokens: Token[];
}

export interface DashboardStats {
  today: {
    totalTokens: number;
    waiting: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    avgServiceTime: number;
    avgWaitTime: number;
  };
  activeQueues: number;
  totalServices: number;
  activeServices: number;
  queues: {
    serviceId: number;
    serviceName: string;
    activeTokens: number;
    currentPosition: number;
  }[];
}

export interface Notification {
  id: number;
  token_id?: number;
  user_id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  sent_at: string;
  read_at?: string;
}
