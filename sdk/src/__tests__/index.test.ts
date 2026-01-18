import AISpendTracker from '../index';

describe('AISpendTracker', () => {
  it('should instantiate with API key', () => {
    const sdk = new AISpendTracker('test-api-key');
    expect(sdk).toBeInstanceOf(AISpendTracker);
  });

  it('should return correct version', () => {
    const sdk = new AISpendTracker('test-api-key');
    expect(sdk.getVersion()).toBe('0.1.0');
  });

  it('should accept custom endpoint', () => {
    const sdk = new AISpendTracker('test-api-key', {
      endpoint: 'https://custom.example.com',
    });
    expect(sdk).toBeInstanceOf(AISpendTracker);
  });

  it('should normalize endpoint with trailing slash', () => {
    const sdk = new AISpendTracker('test-api-key', {
      endpoint: 'https://custom.example.com/',
    });
    expect(sdk.getEndpoint()).toBe('https://custom.example.com');
  });
});

describe('AISpendTracker - OpenAI Integration', () => {
  type ChatParams = Parameters<AISpendTracker['openai']['chat']>[0];

  it('should initialize OpenAI provider', () => {
    const tracker = new AISpendTracker('tracker-api-key');
    const result = tracker.initOpenAI('test-key');
    expect(result).toBe(tracker);
  });

  it('should throw error if OpenAI not initialized', () => {
    const tracker = new AISpendTracker('tracker-api-key');
    const params: ChatParams = {
      model: 'gpt-4',
      messages: [{ role: 'user' as const, content: 'Hi' }],
    };
    expect(() => tracker.openai.chat(params)).toThrow(
      'OpenAI not initialized. Call initOpenAI(apiKey) first.',
    );
  });

  it('should have openai.chat method after init', () => {
    const tracker = new AISpendTracker('tracker-api-key').initOpenAI('test-key');
    expect(typeof tracker.openai.chat).toBe('function');
  });

  it('should have openai.embeddings method after init', () => {
    const tracker = new AISpendTracker('tracker-api-key').initOpenAI('test-key');
    expect(typeof tracker.openai.embeddings).toBe('function');
  });
});

describe('AISpendTracker - Anthropic Integration', () => {
  type MessagesParams = Parameters<AISpendTracker['anthropic']['messages']>[0];

  it('should initialize Anthropic provider', () => {
    const tracker = new AISpendTracker('tracker-api-key');
    const result = tracker.initAnthropic('test-key');
    expect(result).toBe(tracker);
  });

  it('should have anthropic.messages method after init', () => {
    const tracker = new AISpendTracker('tracker-api-key').initAnthropic(
      'test-key',
    );
    expect(typeof tracker.anthropic.messages).toBe('function');
  });

  it('should throw error if Anthropic not initialized', () => {
    const tracker = new AISpendTracker('tracker-api-key');
    const params: MessagesParams = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'Hi' }],
    };
    expect(() => tracker.anthropic.messages(params)).toThrow(
      'Anthropic not initialized. Call initAnthropic(apiKey) first.',
    );
  });
});

describe('AISpendTracker - Google Integration', () => {
  type GenerateParams = Parameters<AISpendTracker['google']['generateContent']>[1];

  it('should initialize Google provider', () => {
    const tracker = new AISpendTracker('tracker-api-key');
    const result = tracker.initGoogle('test-key');
    expect(result).toBe(tracker);
  });

  it('should have google.generateContent method after init', () => {
    const tracker = new AISpendTracker('tracker-api-key').initGoogle('test-key');
    expect(typeof tracker.google.generateContent).toBe('function');
  });

  it('should throw error if Google not initialized', () => {
    const tracker = new AISpendTracker('tracker-api-key');
    const params: GenerateParams = 'Hello';
    expect(() =>
      tracker.google.generateContent('gemini-pro', params),
    ).toThrow('Google not initialized. Call initGoogle(apiKey) first.');
  });
});

describe('AISpendTracker - Multi-Provider', () => {
  it('should initialize all providers independently', () => {
    const tracker = new AISpendTracker('tracker-api-key')
      .initOpenAI('openai-key')
      .initAnthropic('anthropic-key')
      .initGoogle('google-key');

    expect(typeof tracker.openai.chat).toBe('function');
    expect(typeof tracker.anthropic.messages).toBe('function');
    expect(typeof tracker.google.generateContent).toBe('function');
  });
});

