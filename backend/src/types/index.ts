export interface User {
  id: string;
  email: string;
  apiKey: string;
  plan: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiLog {
  id: string;
  userId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs?: number;
  cost: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  projectId?: string;
  timestamp: Date;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Request } from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        apiKey?: string;
      };
      quota?: {
        allowed: boolean;
        current: number;
        limit: number;
      };
    }
  }
}
