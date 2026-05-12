/**
 * Subscription plans and quotas for the API.
 * Keys match the `plan` column value stored in the User table.
 */
export const PLANS = {
  free: {
    requestLimit: 10000,      // 10K events/month
    projectLimit: 1,          // max 1 project
    dataRetentionDays: 30,    // 30 days of history
    alertsEnabled: false,     // no budget/Slack/email alerts
    csvExport: false,
  },
  starter: {
    requestLimit: 500000,     // 500K events/month
    projectLimit: 3,          // max 3 projects
    dataRetentionDays: 90,    // 90 days of history
    alertsEnabled: true,      // budget alerts + Slack/email
    csvExport: true,
  },
  growth: {
    requestLimit: -1,         // unlimited events
    projectLimit: -1,         // unlimited projects
    dataRetentionDays: 365,   // 1 year of history
    alertsEnabled: true,
    csvExport: true,
  },
} as const;

export type Plan = keyof typeof PLANS;

/**
 * Supported AI providers for logging and validation.
 */
export const AI_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
  'cohere',
  'replicate',
] as const;

/**
 * JWT configuration used for signing and verification.
 */
export const JWT_CONFIG = {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  algorithm: 'HS256',
} as const;

