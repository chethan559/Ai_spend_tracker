const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI — price per token (per-million / 1_000_000)
  'gpt-4o':                     { input: 0.000005,    output: 0.000015   },
  'gpt-4o-mini':                { input: 0.00000015,  output: 0.0000006  },
  'gpt-4-turbo':                { input: 0.00001,     output: 0.00003    },
  'gpt-3.5-turbo':              { input: 0.0000005,   output: 0.0000015  },
  // Anthropic
  'claude-3-5-sonnet-20241022': { input: 0.000003,    output: 0.000015   },
  'claude-3-5-haiku-20241022':  { input: 0.0000008,   output: 0.000004   },
  'claude-3-opus-20240229':     { input: 0.000015,    output: 0.000075   },
  'claude-3-sonnet-20240229':   { input: 0.000003,    output: 0.000015   },
  'claude-3-haiku-20240307':    { input: 0.00000025,  output: 0.00000125 },
  // Google
  'gemini-1.5-pro':             { input: 0.00000125,  output: 0.000005   },
  'gemini-1.5-flash':           { input: 0.000000075, output: 0.0000003  },
  'gemini-pro':                 { input: 0.0000005,   output: 0.0000015  },
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = PRICING[model];
  if (!pricing) {
    // Unknown model — fall back to gpt-4o pricing as a safe upper bound
    return inputTokens * 0.000005 + outputTokens * 0.000015;
  }
  return inputTokens * pricing.input + outputTokens * pricing.output;
}
