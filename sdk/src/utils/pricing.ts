// Prices are in USD per 1 million tokens.
// This is the canonical pricing table — keep in sync with backend/src/utils/pricing.ts.

export const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
  // GPT-4o family
  'gpt-4o':                    { input: 5.00,   output: 15.00  },
  'gpt-4o-2024-11-20':         { input: 2.50,   output: 10.00  },
  'gpt-4o-2024-08-06':         { input: 2.50,   output: 10.00  },
  'gpt-4o-2024-05-13':         { input: 5.00,   output: 15.00  },
  // GPT-4o mini family
  'gpt-4o-mini':               { input: 0.15,   output: 0.60   },
  'gpt-4o-mini-2024-07-18':    { input: 0.15,   output: 0.60   },
  // GPT-4 turbo family
  'gpt-4-turbo':               { input: 10.00,  output: 30.00  },
  'gpt-4-turbo-2024-04-09':    { input: 10.00,  output: 30.00  },
  'gpt-4-turbo-preview':       { input: 10.00,  output: 30.00  },
  'gpt-4-0125-preview':        { input: 10.00,  output: 30.00  },
  // GPT-4 legacy
  'gpt-4':                     { input: 30.00,  output: 60.00  },
  'gpt-4-32k':                 { input: 60.00,  output: 120.00 },
  // GPT-3.5
  'gpt-3.5-turbo':             { input: 0.50,   output: 1.50   },
  'gpt-3.5-turbo-0125':        { input: 0.50,   output: 1.50   },
  'gpt-3.5-turbo-instruct':    { input: 1.50,   output: 2.00   },
  // o1 / o3 family
  'o1':                        { input: 15.00,  output: 60.00  },
  'o1-mini':                   { input: 3.00,   output: 12.00  },
  'o1-preview':                { input: 15.00,  output: 60.00  },
  'o3-mini':                   { input: 1.10,   output: 4.40   },
  // Embeddings (output tokens are always 0 for embeddings)
  'text-embedding-3-small':    { input: 0.02,   output: 0.00   },
  'text-embedding-3-large':    { input: 0.13,   output: 0.00   },
  'text-embedding-ada-002':    { input: 0.10,   output: 0.00   },
};

export const ANTHROPIC_PRICING: Record<string, { input: number; output: number }> = {
  // Claude 4 family
  'claude-opus-4-5':                  { input: 15.00, output: 75.00 },
  'claude-sonnet-4-5':                { input: 3.00,  output: 15.00 },
  'claude-sonnet-4-5-20250514':       { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5':                 { input: 0.80,  output: 4.00  },
  'claude-haiku-4-5-20251001':        { input: 0.80,  output: 4.00  },
  // Claude 3.7 family
  'claude-3-7-sonnet-20250219':       { input: 3.00,  output: 15.00 },
  // Claude 3.5 family
  'claude-3-5-sonnet-20241022':       { input: 3.00,  output: 15.00 },
  'claude-3-5-sonnet-20240620':       { input: 3.00,  output: 15.00 },
  'claude-3-5-haiku-20241022':        { input: 0.80,  output: 4.00  },
  // Claude 3 family
  'claude-3-opus-20240229':           { input: 15.00, output: 75.00 },
  'claude-3-sonnet-20240229':         { input: 3.00,  output: 15.00 },
  'claude-3-haiku-20240307':          { input: 0.25,  output: 1.25  },
};

export const GROQ_PRICING: Record<string, { input: number; output: number }> = {
  'llama-3.3-70b-versatile':  { input: 0.59,  output: 0.79  },
  'llama-3.1-70b-versatile':  { input: 0.59,  output: 0.79  },
  'llama-3.1-8b-instant':     { input: 0.05,  output: 0.08  },
  'llama3-70b-8192':          { input: 0.59,  output: 0.79  },
  'llama3-8b-8192':           { input: 0.05,  output: 0.08  },
  'mixtral-8x7b-32768':       { input: 0.24,  output: 0.24  },
  'gemma2-9b-it':             { input: 0.20,  output: 0.20  },
};

export const TOGETHER_PRICING: Record<string, { input: number; output: number }> = {
  'mistralai/mixtral-8x7b':   { input: 0.60,  output: 0.60  },
  'meta-llama/llama-3-70b':   { input: 0.90,  output: 0.90  },
};

export const GOOGLE_PRICING: Record<string, { input: number; output: number }> = {
  // Gemini 2.0 family
  'gemini-2.0-flash':                 { input: 0.10,  output: 0.40  },
  'gemini-2.0-flash-exp':             { input: 0.10,  output: 0.40  },
  // Gemini 1.5 family
  'gemini-1.5-pro':                   { input: 1.25,  output: 5.00  },
  'gemini-1.5-pro-latest':            { input: 1.25,  output: 5.00  },
  'gemini-1.5-flash':                 { input: 0.075, output: 0.30  },
  'gemini-1.5-flash-latest':          { input: 0.075, output: 0.30  },
  'gemini-1.5-flash-8b':              { input: 0.0375, output: 0.15 },
  // Gemini 1.0 legacy
  'gemini-pro':                       { input: 0.50,  output: 1.50  },
  'gemini-1.0-pro':                   { input: 0.50,  output: 1.50  },
};

/**
 * Calculate cost for a model call. Returns the cost in USD and whether the
 * model was recognised. Unknown models fall back to GPT-4o pricing and set
 * isEstimated: true so callers can flag the value appropriately.
 */
export function calculateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
): { cost: number; isEstimated: boolean } {
  const normalizedModel = model.toLowerCase().trim();

  let table: Record<string, { input: number; output: number }> | null = null;
  if (provider === 'openai') table = OPENAI_PRICING;
  else if (provider === 'anthropic') table = ANTHROPIC_PRICING;
  else if (provider === 'google' || provider === 'gemini') table = GOOGLE_PRICING;
  else if (provider === 'groq') table = GROQ_PRICING;
  else if (provider === 'together') table = TOGETHER_PRICING;

  const pricing = table?.[normalizedModel];

  if (!pricing) {
    console.warn(`[AISpendTracker] Unknown model "${model}" for provider "${provider}". Cost set to $0.`);
    return { cost: 0, isEstimated: true };
  }

  const cost = ((inputTokens * pricing.input) + (outputTokens * pricing.output)) / 1_000_000;
  return { cost, isEstimated: false };
}

/**
 * Check if a model is in the known pricing table for a given provider.
 */
export function isKnownModel(provider: string, model: string): boolean {
  const normalizedModel = model.toLowerCase().trim();
  if (provider === 'openai') return normalizedModel in OPENAI_PRICING;
  if (provider === 'anthropic') return normalizedModel in ANTHROPIC_PRICING;
  if (provider === 'google' || provider === 'gemini') return normalizedModel in GOOGLE_PRICING;
  if (provider === 'groq') return normalizedModel in GROQ_PRICING;
  if (provider === 'together') return normalizedModel in TOGETHER_PRICING;
  return false;
}
