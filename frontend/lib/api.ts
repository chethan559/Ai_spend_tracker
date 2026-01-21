'use client';

import axios, { AxiosError, AxiosHeaders } from 'axios';
import { toast } from 'sonner';
import type {
  ApiLog,
  DailyStat,
  ModelStat,
  ProviderStat,
  StatsOverview,
  User,
} from '../types';

/**
 * Shared API client for the frontend.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth-token');
    if (token) {
      const headers = AxiosHeaders.from(config.headers);
      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;

    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    } else if (typeof window !== 'undefined') {
      const message = error.response?.data?.message || error.message || 'Request failed';
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

export interface SignupResponse {
  user: User;
  apiKey: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ProfileResponse {
  user: User;
}

export interface CreateLogInput {
  provider: string;
  model: string;
  tokens: number;
  cost: number;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export interface CreateLogResponse {
  log: ApiLog;
}

export interface LogsQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  provider?: string;
  model?: string;
  projectId?: string;
}

export interface LogsResponse {
  logs: ApiLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Sign up a new user account.
 */
export async function signup(email: string, password: string): Promise<SignupResponse> {
  const response = await api.post<SignupResponse>('/auth/signup', { email, password });
  return response.data;
}

/**
 * Log in with email and password.
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
}

/**
 * Fetch the authenticated user's profile.
 */
export async function getProfile(): Promise<ProfileResponse> {
  const response = await api.get<ProfileResponse>('/auth/profile');
  return response.data;
}

/**
 * Create a new API log entry.
 */
export async function createLog(log: CreateLogInput): Promise<CreateLogResponse> {
  const response = await api.post<CreateLogResponse>('/api/v1/log', log);
  return response.data;
}

/**
 * Fetch API logs with pagination and filters.
 */
export async function getLogs(params: LogsQueryParams = {}): Promise<LogsResponse> {
  const response = await api.get<LogsResponse>('/api/v1/log', { params });
  return response.data;
}

/**
 * Get high-level stats for a date range.
 */
export async function getOverview(
  startDate?: string,
  endDate?: string,
): Promise<StatsOverview> {
  const response = await api.get<StatsOverview>('/api/v1/stats/overview', {
    params: { startDate, endDate },
  });
  return response.data;
}

/**
 * Get daily stats for the last N days.
 */
export async function getDailyStats(days: number): Promise<DailyStat[]> {
  const response = await api.get<DailyStat[]>('/api/v1/stats/daily', {
    params: { days },
  });
  return response.data;
}

/**
 * Get provider-level breakdown for a date range.
 */
export async function getProviderBreakdown(
  startDate?: string,
  endDate?: string,
): Promise<ProviderStat[]> {
  const response = await api.get<ProviderStat[]>('/api/v1/stats/providers', {
    params: { startDate, endDate },
  });
  return response.data;
}

/**
 * Get model-level breakdown for a date range.
 */
export async function getModelBreakdown(
  startDate?: string,
  endDate?: string,
): Promise<ModelStat[]> {
  const response = await api.get<ModelStat[]>('/api/v1/stats/models', {
    params: { startDate, endDate },
  });
  return response.data;
}
