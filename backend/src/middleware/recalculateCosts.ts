import type { NextFunction, Request, Response } from 'express';
import { calculateCost } from '../utils/pricing';

interface RawLogEvent {
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  // Legacy field names from older SDK versions
  input_tokens?: number;
  output_tokens?: number;
  tokens?: number;
  cost?: number;
  cost_usd?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

function recalcEvent(event: RawLogEvent): RawLogEvent {
  const model = event.model ?? '';

  const inputTokens =
    typeof event.inputTokens === 'number'
      ? event.inputTokens
      : typeof event.input_tokens === 'number'
        ? event.input_tokens
        : typeof event.tokens === 'number'
          ? event.tokens
          : 0;

  const outputTokens =
    typeof event.outputTokens === 'number'
      ? event.outputTokens
      : typeof event.output_tokens === 'number'
        ? event.output_tokens
        : 0;

  const known = [
    'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo',
    'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307',
    'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro',
  ];

  const isKnownModel = known.includes(model.toLowerCase());

  if (!isKnownModel) {
    return {
      ...event,
      metadata: { ...(event.metadata ?? {}), _cost_unverified: true },
    };
  }

  const calculatedCost = calculateCost(model, inputTokens, outputTokens);

  return {
    ...event,
    cost: calculatedCost,
    cost_usd: calculatedCost,
  };
}

/**
 * Recalculates cost for each event in the batch using the server-side pricing
 * table, overwriting the SDK-provided cost before the DB write.
 * Unknown models keep their SDK cost and gain metadata._cost_unverified = true.
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
