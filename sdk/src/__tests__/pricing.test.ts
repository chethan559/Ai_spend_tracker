import {
  calculateAnthropicCost,
  calculateGoogleCost,
  calculateOpenAICost,
} from '../utils/pricing';

describe('OpenAI Cost Calculator', () => {
  it('should calculate GPT-4 cost correctly', () => {
    const cost = calculateOpenAICost('gpt-4', 1000, 500);
    expect(cost).toBeCloseTo(0.06);
  });

  it('should calculate GPT-3.5 cost correctly', () => {
    const cost = calculateOpenAICost('gpt-3.5-turbo', 2000, 1000);
    expect(cost).toBeCloseTo(0.0025);
  });

  it('should calculate embedding cost correctly', () => {
    const cost = calculateOpenAICost('text-embedding-3-small', 1000, 0);
    expect(cost).toBeCloseTo(0.00002);
  });

  it('should return 0 for unknown model', () => {
    const cost = calculateOpenAICost('unknown-model', 1000, 1000);
    expect(cost).toBe(0);
  });

  it('should handle zero tokens', () => {
    const cost = calculateOpenAICost('gpt-4', 0, 0);
    expect(cost).toBe(0);
  });
});

describe('Anthropic Cost Calculator', () => {
  it('should calculate Claude Opus cost correctly', () => {
    const cost = calculateAnthropicCost('claude-3-opus-20240229', 1000, 500);
    expect(cost).toBeCloseTo(0.0525);
  });

  it('should calculate Claude Sonnet cost correctly', () => {
    const cost = calculateAnthropicCost('claude-3-sonnet-20240229', 2000, 1000);
    expect(cost).toBeCloseTo(0.021);
  });

  it('should calculate Claude Haiku cost correctly', () => {
    const cost = calculateAnthropicCost('claude-3-haiku-20240307', 5000, 2000);
    expect(cost).toBeCloseTo(0.00375);
  });

  it('should return 0 for unknown Anthropic model', () => {
    const cost = calculateAnthropicCost('unknown-model', 1000, 1000);
    expect(cost).toBe(0);
  });
});

describe('Google Cost Calculator', () => {
  it('should calculate Gemini Pro cost correctly', () => {
    const cost = calculateGoogleCost('gemini-pro', 1000, 500);
    expect(cost).toBeCloseTo(0.00125);
  });

  it('should calculate Gemini 1.5 Pro cost correctly', () => {
    const cost = calculateGoogleCost('gemini-1.5-pro', 2000, 1000);
    expect(cost).toBeCloseTo(0.0175);
  });

  it('should return 0 for unknown Google model', () => {
    const cost = calculateGoogleCost('unknown-model', 1000, 1000);
    expect(cost).toBe(0);
  });
});

