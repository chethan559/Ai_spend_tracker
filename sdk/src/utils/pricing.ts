/**
 * OpenAI pricing per 1M tokens for supported models.
 */
export const OPENAI_PRICING: {
  [modelName: string]: {
    input: number;
    output?: number;
  };
} = {
  'gpt-4-turbo-preview': { input: 10, output: 30 },
  'gpt-4-0125-preview': { input: 10, output: 30 },
  'gpt-4': { input: 30, output: 60 },
  'gpt-4-32k': { input: 60, output: 120 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'gpt-3.5-turbo-0125': { input: 0.5, output: 1.5 },
  'gpt-3.5-turbo-instruct': { input: 1.5, output: 2 },
  'text-embedding-3-small': { input: 0.02 },
  'text-embedding-3-large': { input: 0.13 },
  'text-embedding-ada-002': { input: 0.1 },
};

/**
 * Anthropic pricing per 1M tokens for supported Claude models.
 */
export const ANTHROPIC_PRICING: {
  [modelName: string]: {
    input: number;
    output: number;
  };
} = {
  'claude-3-opus-20240229': { input: 15, output: 75 },
  'claude-3-sonnet-20240229': { input: 3, output: 15 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'claude-2.1': { input: 8, output: 24 },
  'claude-2.0': { input: 8, output: 24 },
  'claude-instant-1.2': { input: 0.8, output: 2.4 },
};

/**
 * Google Gemini pricing per 1M tokens for supported models.
 */
export const GOOGLE_PRICING: {
  [modelName: string]: {
    input: number;
    output: number;
  };
} = {
  'gemini-pro': { input: 0.5, output: 1.5 },
  'gemini-pro-vision': { input: 0.5, output: 1.5 },
  'gemini-1.5-pro': { input: 3.5, output: 10.5 },
  'gemini-1.5-flash': { input: 0.35, output: 1.05 },
};

/**
 * Calculate OpenAI token cost in USD for a model and token usage.
 */
export function calculateOpenAICost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = OPENAI_PRICING[model];
  if (!pricing) {
    return 0;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  if (pricing.output === undefined) {
    return inputCost;
  }

  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Calculate Anthropic token cost in USD for a model and token usage.
 */
export function calculateAnthropicCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = ANTHROPIC_PRICING[model];
  if (!pricing) {
    return 0;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Calculate Google Gemini token cost in USD for a model and token usage.
 */
export function calculateGoogleCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = GOOGLE_PRICING[model];
  if (!pricing) {
    return 0;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

