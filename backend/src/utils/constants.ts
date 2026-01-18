/**
 * Subscription plans and quotas for the API.
 */
export const PLANS = {
  FREE: { name: 'free', requestLimit: 10000, price: 0 },
  STARTER: { name: 'starter', requestLimit: 100000, price: 29 },
  PRO: { name: 'pro', requestLimit: 1000000, price: 99 },
  BUSINESS: { name: 'business', requestLimit: 10000000, price: 299 },
} as const;

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

