'use client';

import axios, { AxiosError, AxiosHeaders } from 'axios';
import { toast } from 'sonner';
import type {
  ApiLog,
  DailyStat,
  MetadataStat,
  ModelStat,
  Project,
  ProviderDetail,
  ProviderStat,
  StatsOverview,
  TotalSpendResult,
  User,
} from '../types';

// The response interceptor below returns response.data, so all api.method<T>() calls
// resolve to T at runtime. This interface reflects that so callers don't need casts.
interface UnwrappedAxios {
  get<T>(url: string, config?: object): Promise<T>;
  post<T>(url: string, data?: unknown, config?: object): Promise<T>;
  put<T>(url: string, data?: unknown, config?: object): Promise<T>;
  delete<T>(url: string, config?: object): Promise<T>;
  interceptors: ReturnType<typeof axios.create>['interceptors'];
}

/**
 * Shared API client for the frontend.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
}) as unknown as UnwrappedAxios;

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth-token');
    if (token) {
      const headers = AxiosHeaders.from(config.headers);
      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;
    }

    if (process.env.NODE_ENV === 'development') {
      const method = config.method?.toUpperCase() ?? 'GET';
      const url = config.url ?? '';
      console.debug(`[API] ${method} ${url}`);
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;

    if (typeof window !== 'undefined') {
      if (status === 401) {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        toast.error('Session expired, please login');
        window.location.href = '/login';
      } else {
        const message =
          error.response?.data?.message ||
          error.message ||
          'Request failed';
        toast.error(message);
      }
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

export interface DailyStatsResponse {
  stats: DailyStat[];
  period: {
    days: number;
    startDate: string;
    endDate: string;
    timezone: string;
  };
}

export interface ProviderBreakdownResponse {
  providers: ProviderStat[];
  totalSpend: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface ModelBreakdownResponse {
  models: ModelStat[];
  totalSpend: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Sign up a new user account.
 */
export async function signup(email: string, password: string): Promise<SignupResponse> {
  try {
    return await api.post<SignupResponse>('/auth/signup', { email, password });
  } catch (error) {
    throw error;
  }
}

/**
 * Log in with email and password.
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    return await api.post<LoginResponse>('/auth/login', { email, password });
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch the authenticated user's profile.
 */
export async function getProfile(): Promise<ProfileResponse> {
  try {
    return await api.get<ProfileResponse>('/auth/profile');
  } catch (error) {
    throw error;
  }
}

/**
 * Create a new API log entry.
 */
export async function createLog(log: CreateLogInput): Promise<CreateLogResponse> {
  try {
    return await api.post<CreateLogResponse>('/api/v1/log', log);
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch API logs with pagination and filters.
 */
export async function getLogs(params: LogsQueryParams = {}): Promise<LogsResponse> {
  try {
    return await api.get<LogsResponse>('/api/v1/log', { params });
  } catch (error) {
    throw error;
  }
}

/**
 * Get high-level stats for a date range.
 */
export async function getOverview(
  startDate?: string,
  endDate?: string,
  projectId?: string | null,
): Promise<StatsOverview> {
  try {
    return await api.get<StatsOverview>('/api/v1/stats/overview', {
      params: { startDate, endDate, ...(projectId ? { projectId } : {}) },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Get daily stats for the last N days, bucketed in the given timezone.
 */
export async function getDailyStats(
  days: number,
  timezone?: string,
  projectId?: string | null,
): Promise<DailyStat[]> {
  try {
    const response = await api.get<DailyStatsResponse>('/api/v1/stats/daily', {
      params: { days, timezone, ...(projectId ? { projectId } : {}) },
    });
    return response.stats;
  } catch (error) {
    throw error;
  }
}

/**
 * Get provider-level breakdown for a date range.
 */
export async function getProviderBreakdown(
  startDate?: string,
  endDate?: string,
  projectId?: string | null,
): Promise<ProviderStat[]> {
  try {
    const response = await api.get<ProviderBreakdownResponse>('/api/v1/stats/by-provider', {
      params: { startDate, endDate, ...(projectId ? { projectId } : {}) },
    });
    return response.providers;
  } catch (error) {
    throw error;
  }
}

/**
 * Get model-level breakdown for a date range.
 */
export async function getModelBreakdown(
  startDate?: string,
  endDate?: string,
  projectId?: string | null,
): Promise<ModelStat[]> {
  try {
    const response = await api.get<ModelBreakdownResponse>('/api/v1/stats/by-model', {
      params: { startDate, endDate, ...(projectId ? { projectId } : {}) },
    });
    return response.models;
  } catch (error) {
    throw error;
  }
}

/**
 * Get metadata field value breakdown for a date range.
 */
export async function getMetadataStats(
  field: string,
  startDate?: string,
  endDate?: string,
  projectId?: string | null,
): Promise<MetadataStat[]> {
  const res: any = await api.get<any>('/api/v1/stats/by-metadata', {
    params: { field, startDate, endDate, ...(projectId ? { projectId } : {}) },
  });
  const rows: { value: string; spend: number; requests: number }[] =
    res?.breakdown ?? res ?? [];
  return rows.map((r) => ({
    value: r.value,
    totalCost: r.spend,
    requestCount: r.requests,
    avgCost: r.requests > 0 ? r.spend / r.requests : 0,
  }));
}

/**
 * Get total spend with provider breakdown and period-over-period change.
 */
export async function getTotalSpend(
  startDate?: string,
  endDate?: string,
  projectId?: string | null,
): Promise<TotalSpendResult> {
  try {
    return await api.get<TotalSpendResult>('/api/v1/stats/total-spend', {
      params: { startDate, endDate, ...(projectId ? { projectId } : {}) },
    });
  } catch (error) {
    throw error;
  }
}

export interface ProviderDetailResponse {
  providers: ProviderDetail[];
}

export async function getProviderDetail(): Promise<ProviderDetailResponse> {
  try {
    return await api.get<ProviderDetailResponse>('/api/v1/stats/by-provider-detail');
  } catch (error) {
    throw error;
  }
}

export interface FeatureLogsParams {
  metadataField: string;
  metadataValue: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

/**
 * Fetch logs filtered by a metadata field/value pair.
 */
export async function getFeatureLogs(params: FeatureLogsParams): Promise<LogsResponse> {
  try {
    return await api.get<LogsResponse>('/api/v1/log', {
      params: {
        metadata_field: params.metadataField,
        metadata_value: params.metadataValue,
        startDate: params.startDate,
        endDate: params.endDate,
        limit: params.limit ?? 200,
      },
    });
  } catch (error) {
    throw error;
  }
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const res = await api.get<{ data: Project[] }>('/api/v1/projects');
  return res.data;
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const res = await api.post<{ data: Project }>('/api/v1/projects', { name, description });
  return res.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete<void>(`/api/v1/projects/${id}`);
}
