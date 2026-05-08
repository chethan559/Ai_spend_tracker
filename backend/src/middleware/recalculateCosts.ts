import type { NextFunction, Request, Response } from 'express';

interface ModelPricing {
  input: number;  // $ per token
  output: number; // $ per token
}

// Prices in USD per token (divide published per-1M-token prices by 1_000_000).
const PRICING_TABLE: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4o':           { input: 0.000_005,    output: 0.000_015    },
  'gpt-3.5-turbo':    { input: 0.000_000_5,  output: 0.000_001_5  },
  // Anthropic Claude 3
  'claude-3-opus':    { input: 0.000_015,    output: 0.000_075    },
  'claude-3-sonnet':  { input: 0.000_003,    output: 0.000_015    },
  'claude-3-haiku':   { input: 0.000_000_25, output: 0.000_001_25 },
  // Google Gemini
  'gemini-pro':       { input: 0.000_000_5,  output: 0.000_001_5  },
  'gemini-1.5-pro':   { input: 0.000_003_5,  output: 0.000_010_5  },
};

const MODEL_MATCHERS: Array<[string, string]> = [
  ['gpt-4o',          'gpt-4o'],
  ['gpt-3.5-turbo',   'gpt-3.5-turbo'],
  ['claude-3-opus',   'claude-3-opus'],
  ['claude-3-sonnet', 'claude-3-sonnet'],
  ['claude-3-haiku',  'claude-3-haiku'],
  ['gemini-1.5-pro',  'gemini-1.5-pro'],  // must precede 'gemini-pro'
  ['gemini-pro',      'gemini-pro'],
];

function lookupPricing(model: string): ModelPricing | null {
  const normalized = model.toLowerCase();
  for (const [pattern, key] of MODEL_MATCHERS) {
    if (normalized.includes(pattern)) return PRICING_TABLE[key] ?? null;
  }
  return null;
}

interface RawLogEvent {
  model?: string;
  tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  cost?: number;
  cost_usd?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

function recalcEvent(event: RawLogEvent): RawLogEvent {
  const model = event.model ?? '';
  const pricing = lookupPricing(model);

  if (!pricing) {
    return {
      ...event,
      metadata: { ...(event.metadata ?? {}), _cost_unverified: true },
    };
  }

  const inputTokens =
    typeof event.input_tokens === 'number'
      ? event.input_tokens
      : typeof event.tokens === 'number'
        ? event.tokens
        : 0;

  const outputTokens =
    typeof event.output_tokens === 'number' ? event.output_tokens : 0;

  const calculatedCost =
    inputTokens * pricing.input + outputTokens * pricing.output;

  return {
    ...event,
    cost: calculatedCost,
    cost_usd: calculatedCost,
  };
}

/**
 * Recalculates cost for each event in the batch using a server-side pricing
 * table, overwriting the SDK-provided cost value before the DB write.
 * Models not in the pricing table keep their SDK cost and are flagged with
 * metadata._cost_unverified = true.
 */
export function recalculateCosts(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.body) return next();

  if (Array.isArray(req.body)) {
    req.body = (req.body as RawLogEvent[]).map(recalcEvent);
  } else if (typeof req.body === 'object') {
    req.body = recalcEvent(req.body as RawLogEvent);
  }

  next();
}
