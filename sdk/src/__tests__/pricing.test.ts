import { calculateCost, isKnownModel } from '../utils/pricing';

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------

describe('OpenAI pricing', () => {
  it('calculates gpt-4 cost correctly', () => {
    const { cost, isEstimated } = calculateCost('openai', 'gpt-4', 1000, 500);
    expect(cost).toBeCloseTo(0.06);   // (1000*30 + 500*60) / 1_000_000
    expect(isEstimated).toBe(false);
  });

  it('calculates gpt-4o cost correctly (was returning $0 before fix)', () => {
    const { cost, isEstimated } = calculateCost('openai', 'gpt-4o', 1000, 500);
    expect(cost).toBeCloseTo(0.0125); // (1000*5 + 500*15) / 1_000_000
    expect(isEstimated).toBe(false);
  });

  it('calculates gpt-4o-mini cost correctly (was returning $0 before fix)', () => {
    const { cost, isEstimated } = calculateCost('openai', 'gpt-4o-mini', 1000, 500);
    expect(cost).toBeCloseTo(0.00045); // (1000*0.15 + 500*0.60) / 1_000_000
    expect(isEstimated).toBe(false);
  });

  it('calculates gpt-3.5-turbo cost correctly', () => {
    const { cost } = calculateCost('openai', 'gpt-3.5-turbo', 2000, 1000);
    expect(cost).toBeCloseTo(0.0025); // (2000*0.50 + 1000*1.50) / 1_000_000
  });

  it('calculates embedding cost correctly (output tokens = 0)', () => {
    const { cost, isEstimated } = calculateCost('openai', 'text-embedding-3-small', 1000, 0);
    expect(cost).toBeCloseTo(0.00002); // (1000*0.02) / 1_000_000
    expect(isEstimated).toBe(false);
  });

  it('handles zero tokens', () => {
    const { cost } = calculateCost('openai', 'gpt-4o', 0, 0);
    expect(cost).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Anthropic
// ---------------------------------------------------------------------------

describe('Anthropic pricing', () => {
  it('calculates claude-3-opus cost correctly', () => {
    const { cost, isEstimated } = calculateCost('anthropic', 'claude-3-opus-20240229', 1000, 500);
    expect(cost).toBeCloseTo(0.0525); // (1000*15 + 500*75) / 1_000_000
    expect(isEstimated).toBe(false);
  });

  it('calculates claude-3-sonnet cost correctly', () => {
    const { cost } = calculateCost('anthropic', 'claude-3-sonnet-20240229', 2000, 1000);
    expect(cost).toBeCloseTo(0.021);  // (2000*3 + 1000*15) / 1_000_000
  });

  it('calculates claude-3-haiku cost correctly', () => {
    const { cost } = calculateCost('anthropic', 'claude-3-haiku-20240307', 5000, 2000);
    expect(cost).toBeCloseTo(0.00375); // (5000*0.25 + 2000*1.25) / 1_000_000
  });

  it('calculates claude-3-5-sonnet-20241022 cost correctly (was returning $0 before fix)', () => {
    const { cost, isEstimated } = calculateCost('anthropic', 'claude-3-5-sonnet-20241022', 1000, 500);
    expect(cost).toBeCloseTo(0.0105); // (1000*3 + 500*15) / 1_000_000
    expect(isEstimated).toBe(false);
  });

  it('calculates claude-3-5-haiku-20241022 cost correctly (was returning $0 before fix)', () => {
    const { cost, isEstimated } = calculateCost('anthropic', 'claude-3-5-haiku-20241022', 1000, 500);
    expect(cost).toBeCloseTo(0.0028); // (1000*0.80 + 500*4.00) / 1_000_000
    expect(isEstimated).toBe(false);
  });

  it('calculates claude-3-7-sonnet-20250219 cost correctly (was returning $0 before fix)', () => {
    const { cost, isEstimated } = calculateCost('anthropic', 'claude-3-7-sonnet-20250219', 1000, 500);
    expect(cost).toBeCloseTo(0.0105); // (1000*3 + 500*15) / 1_000_000
    expect(isEstimated).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Google
// ---------------------------------------------------------------------------

describe('Google pricing', () => {
  it('calculates gemini-pro cost correctly', () => {
    const { cost, isEstimated } = calculateCost('google', 'gemini-pro', 1000, 500);
    expect(cost).toBeCloseTo(0.00125); // (1000*0.50 + 500*1.50) / 1_000_000
    expect(isEstimated).toBe(false);
  });

  it('calculates gemini-1.5-pro cost correctly (updated pricing)', () => {
    const { cost } = calculateCost('google', 'gemini-1.5-pro', 2000, 1000);
    expect(cost).toBeCloseTo(0.0075); // (2000*1.25 + 1000*5.00) / 1_000_000
  });

  it('calculates gemini-2.0-flash cost correctly', () => {
    const { cost, isEstimated } = calculateCost('google', 'gemini-2.0-flash', 1000, 500);
    expect(cost).toBeCloseTo(0.0003); // (1000*0.10 + 500*0.40) / 1_000_000
    expect(isEstimated).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Unknown model fallback
// ---------------------------------------------------------------------------

describe('Unknown model fallback', () => {
  it('returns isEstimated: true for an unknown OpenAI model', () => {
    const { isEstimated } = calculateCost('openai', 'gpt-99-ultra', 1000, 1000);
    expect(isEstimated).toBe(true);
  });

  it('returns a non-zero cost for unknown model (falls back to gpt-4o pricing)', () => {
    const { cost } = calculateCost('openai', 'gpt-99-ultra', 1000, 1000);
    expect(cost).toBeGreaterThan(0);
  });

  it('returns isEstimated: true for an unknown Anthropic model', () => {
    const { isEstimated } = calculateCost('anthropic', 'claude-99', 1000, 1000);
    expect(isEstimated).toBe(true);
  });

  it('returns isEstimated: true for a completely unknown provider', () => {
    const { isEstimated } = calculateCost('cohere', 'command-r', 1000, 1000);
    expect(isEstimated).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isKnownModel
// ---------------------------------------------------------------------------

describe('isKnownModel', () => {
  it('returns true for gpt-4o', () => {
    expect(isKnownModel('openai', 'gpt-4o')).toBe(true);
  });

  it('returns true for claude-3-5-sonnet-20241022', () => {
    expect(isKnownModel('anthropic', 'claude-3-5-sonnet-20241022')).toBe(true);
  });

  it('returns true for gemini-1.5-pro', () => {
    expect(isKnownModel('google', 'gemini-1.5-pro')).toBe(true);
  });

  it('returns false for an unknown model', () => {
    expect(isKnownModel('openai', 'gpt-99-ultra')).toBe(false);
  });

  it('returns false for a known model assigned to the wrong provider', () => {
    expect(isKnownModel('google', 'gpt-4o')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isKnownModel('openai', 'GPT-4O')).toBe(true);
    expect(isKnownModel('anthropic', 'Claude-3-5-Sonnet-20241022')).toBe(true);
  });
});
