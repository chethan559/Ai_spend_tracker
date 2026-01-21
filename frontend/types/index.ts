/**
 * User account details returned from the API.
 */
export interface User {
  id: string;
  email: string;
  apiKey: string;
  plan: 'free' | 'starter' | 'pro' | 'business';
  createdAt: string;
  updatedAt: string;
}

/**
 * API log entry for a tracked AI request.
 */
export interface ApiLog {
  id: string;
  provider: string;
  model: string;
  tokens: number;
  cost: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * Aggregate overview stats for a selected period.
 */
export interface StatsOverview {
  totalSpend: number;
  totalRequests: number;
  avgCost: number;
  period: { start: string; end: string };
}

/**
 * Daily spend and request totals.
 */
export interface DailyStat {
  date: string;
  spend: number;
  requests: number;
}

/**
 * Provider-level breakdown of spend and usage.
 */
export interface ProviderStat {
  provider: string;
  spend: number;
  requests: number;
  percentage: number;
}

/**
 * Model-level breakdown of spend and usage.
 */
export interface ModelStat {
  model: string;
  provider: string;
  spend: number;
  requests: number;
  tokens: number;
}

/**
 * Budget configuration and current usage.
 */
export interface Budget {
  id: string;
  provider: string;
  monthlyLimit: number;
  alertThreshold: number;
  currentSpend?: number;
  percentage?: number;
}
