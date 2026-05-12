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

/**
 * Breakdown of spend and usage for a single metadata field value.
 */
export interface MetadataStat {
  value: string;
  totalCost: number;
  requestCount: number;
  avgCost: number;
}

export interface ProviderDetailModel {
  model: string;
  cost: number;
  requests: number;
}

export interface ProviderDetail {
  provider: string;
  status: 'active' | 'idle' | 'no_data';
  lastActivity: string | null;
  thisMonth: { cost: number; requests: number };
  lastMonth: { cost: number; requests: number };
  momChange: number | null;
  topModel: string | null;
  avgCostPerRequest: number;
  daily: DailyStat[];
  topModels: ProviderDetailModel[];
  peakDay: { date: string; cost: number } | null;
  projectedMonthCost: number | null;
}

export interface TotalSpendProvider {
  provider: string;
  cost: number;
  requests: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  totalSpend: number;
  totalRequests: number;
  lastActiveAt: string | null;
}

export interface TotalSpendResult {
  totalCost: number;
  totalRequests: number;
  byProvider: TotalSpendProvider[];
  weekOverWeekChange: number | null;
  dateRange: { start: string; end: string };
}
