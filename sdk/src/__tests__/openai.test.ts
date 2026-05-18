import axios from 'axios';

import OpenAIProvider from '../providers/OpenAIProvider';

const mockChatCreate = jest.fn();
const mockEmbeddingsCreate = jest.fn();

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockChatCreate,
      },
    },
    embeddings: {
      create: mockEmbeddingsCreate,
    },
  })),
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('OpenAIProvider', () => {
  const endpoint = 'https://tracker.example.com';
  const trackerApiKey = 'tracker-key';
  const openaiApiKey = 'openai-key';
  const mockedAxios = axios as unknown as { post: jest.Mock };
  type ChatParams = Parameters<OpenAIProvider['chat']>[0];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with API keys', () => {
    const provider = new OpenAIProvider(openaiApiKey, trackerApiKey, endpoint);
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should call OpenAI chat API and log usage', async () => {
    mockChatCreate.mockResolvedValue({
      usage: {
        prompt_tokens: 1000,
        completion_tokens: 500,
        total_tokens: 1500,
      },
    });

    const provider = new OpenAIProvider(openaiApiKey, trackerApiKey, endpoint);
    const params: ChatParams = {
      model: 'gpt-4',
      messages: [{ role: 'user' as const, content: 'Hi' }],
    };

    await provider.chat(params);

    expect(mockChatCreate).toHaveBeenCalledWith(params);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${endpoint}/api/v1/log`,
      expect.objectContaining({
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: 1000,
        outputTokens: 500,
        costUsd: 0.06,
        timestamp: expect.any(Date),
      }),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': trackerApiKey,
        },
      }),
    );
  });

  it('should skip logging when skipLogging is true', async () => {
    mockChatCreate.mockResolvedValue({
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    });

    const provider = new OpenAIProvider(openaiApiKey, trackerApiKey, endpoint);
    const params: ChatParams = {
      model: 'gpt-4',
      messages: [{ role: 'user' as const, content: 'Hi' }],
    };

    await provider.chat(params, { skipLogging: true });

    expect(mockChatCreate).toHaveBeenCalledWith(params);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should handle OpenAI API errors gracefully', async () => {
    mockChatCreate.mockRejectedValue(new Error('boom'));

    const provider = new OpenAIProvider(openaiApiKey, trackerApiKey, endpoint);
    const params: ChatParams = {
      model: 'gpt-4',
      messages: [{ role: 'user' as const, content: 'Hi' }],
    };

    await expect(provider.chat(params)).rejects.toThrow('boom');
  });

  describe('OpenAI streaming', () => {
    it('should return an async iterable for stream: true', async () => {
      const mockChunks = [
        { choices: [{ delta: { content: 'Hello' } }], usage: null },
        { choices: [{ delta: { content: ' world' } }], usage: null },
        {
          choices: [{ delta: { content: '' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 100, completion_tokens: 50 },
        },
      ];

      const mockStream = async function* () {
        for (const chunk of mockChunks) yield chunk;
      };
      mockChatCreate.mockResolvedValue(mockStream());

      const provider = new OpenAIProvider(openaiApiKey, trackerApiKey, endpoint);
      const result = await provider.chat({
        model: 'gpt-4o',
        messages: [{ role: 'user' as const, content: 'Hi' }],
        stream: true,
      } as ChatParams);

      expect(Symbol.asyncIterator in (result as any)).toBe(true);

      const chunks: unknown[] = [];
      for await (const chunk of result as any) {
        chunks.push(chunk);
      }
      expect(chunks).toHaveLength(3);
    });

    it('should log cost after stream completes', async () => {
      const mockChunks = [
        { choices: [{ delta: { content: 'Hi' } }], usage: null },
        {
          choices: [{ delta: {}, finish_reason: 'stop' }],
          usage: { prompt_tokens: 200, completion_tokens: 80 },
        },
      ];

      const mockStream = async function* () {
        for (const chunk of mockChunks) yield chunk;
      };
      mockChatCreate.mockResolvedValue(mockStream());

      const provider = new OpenAIProvider(openaiApiKey, trackerApiKey, endpoint);
      const result = await provider.chat(
        {
          model: 'gpt-4o',
          messages: [{ role: 'user' as const, content: 'Hi' }],
          stream: true,
        } as ChatParams,
        { metadata: { feature: 'stream-test' } },
      );

      for await (const _ of result as any) { /* consume */ }

      // gpt-4o: (200 * $5 + 80 * $15) / 1_000_000 = $0.002200
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${endpoint}/api/v1/log`,
        expect.objectContaining({
          provider: 'openai',
          model: 'gpt-4o',
          inputTokens: 200,
          outputTokens: 80,
          costUsd: expect.closeTo(0.002200, 4),
        }),
        expect.any(Object),
      );
    });

    it('should not log when skipLogging is true', async () => {
      const mockStream = async function* () {
        yield { choices: [{ delta: { content: 'Hi' } }], usage: null };
      };
      mockChatCreate.mockResolvedValue(mockStream());

      const provider = new OpenAIProvider(openaiApiKey, trackerApiKey, endpoint);
      const result = await provider.chat(
        {
          model: 'gpt-4o',
          messages: [{ role: 'user' as const, content: 'Hi' }],
          stream: true,
        } as ChatParams,
        { skipLogging: true },
      );

      for await (const _ of result as any) { /* consume */ }

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should not affect non-streaming calls', async () => {
      mockChatCreate.mockResolvedValue({
        choices: [{ message: { content: 'Hi' } }],
        usage: { prompt_tokens: 50, completion_tokens: 20 },
      });

      const provider = new OpenAIProvider(openaiApiKey, trackerApiKey, endpoint);
      const result = await provider.chat({
        model: 'gpt-4o',
        messages: [{ role: 'user' as const, content: 'Hi' }],
      });

      expect('choices' in (result as any)).toBe(true);
      expect(Symbol.asyncIterator in (result as any)).toBe(false);
    });
  });
});
