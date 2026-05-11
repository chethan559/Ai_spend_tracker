// Prices are in USD per 1 million tokens.
// Keep this table in sync with sdk/src/utils/pricing.ts — they must be identical.

const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
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
  // Embeddings
  'text-embedding-3-small':    { input: 0.02,   output: 0.00   },
  'text-embedding-3-large':    { input: 0.13,   output: 0.00   },
  'text-embedding-ada-002':    { input: 0.10,   output: 0.00   },
};

const ANTHROPIC_PRICING: Record<string, { input: number; output: number }> = {
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

const GOOGLE_PRICING: Record<string, { input: number; output: number }> = {
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

function tableForProvider(
  provider: string,
): Record<string, { input: number; output: number }> | null {
  if (provider === 'openai') return OPENAI_PRICING;
  if (provider === 'anthropic') return ANTHROPIC_PRICING;
  if (provider === 'google' || provider === 'gemini') return GOOGLE_PRICING;
  return null;
}

export function calculateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const table = tableForProvider(provider);
  const pricing = table?.[model.toLowerCase().trim()];

  if (!pricing) {
    // Unknown model — fall back to gpt-4o pricing as a conservative upper bound.
    const fallback = OPENAI_PRICING['gpt-4o'];
    return ((inputTokens * fallback.input) + (outputTokens * fallback.output)) / 1_000_000;
  }

  return ((inputTokens * pricing.input) + (outputTokens * pricing.output)) / 1_000_000;
}

export function isKnownModel(provider: string, model: string): boolean {
  const table = tableForProvider(provider);
  return table !== null && model.toLowerCase().trim() in table;
}
