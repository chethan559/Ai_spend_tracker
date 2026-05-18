import type { NextFunction, Request, Response } from 'express';
import { calculateCost, isKnownModel } from '../utils/pricing';
import { logger } from '../utils/logger';

interface RawLogEvent {
  provider?: string;
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
  const provider = typeof event.provider === 'string' ? event.provider : '';
  const model = typeof event.model === 'string' ? event.model : '';

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

  const calculatedCost = calculateCost(provider, model, inputTokens, outputTokens);
  const estimated = !isKnownModel(provider, model);

  return {
    ...event,
    cost: calculatedCost,
    cost_usd: calculatedCost,
    ...(estimated
      ? { metadata: { ...(event.metadata ?? {}), _cost_unknown: true } }
      : {}),
  };
}

/**
 * Recalculates cost for every log event using the server-side pricing table,
 * overwriting the SDK-provided cost before the DB write.
 * Unknown models use gpt-4o fallback pricing and receive metadata._cost_unknown = true.
 */
export function recalculateCosts(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.body) return next();

  try {
    if (Array.isArray(req.body)) {
      req.body = (req.body as RawLogEvent[]).map(recalcEvent);
    } else if (typeof req.body === 'object') {
      req.body = recalcEvent(req.body as RawLogEvent);
    }
  } catch (error) {
    logger.error('recalculateCosts middleware failed', error as Error);
  }

  next();
}
