import axios from 'axios';

import AnthropicProvider from '../providers/AnthropicProvider';

const mockMessagesCreate = jest.fn();

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: mockMessagesCreate,
    },
  })),
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('AnthropicProvider', () => {
  const endpoint = 'https://tracker.example.com';
  const trackerApiKey = 'tracker-key';
  const anthropicApiKey = 'anthropic-key';
  const mockedAxios = axios as unknown as { post: jest.Mock };
  type MessagesParams = Parameters<AnthropicProvider['messages']>[0];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with API keys', () => {
    const provider = new AnthropicProvider(
      anthropicApiKey,
      trackerApiKey,
      endpoint,
    );
    expect(provider).toBeInstanceOf(AnthropicProvider);
  });

  it('should call Anthropic messages API and log usage', async () => {
    mockMessagesCreate.mockResolvedValue({
      usage: {
        input_tokens: 1000,
        output_tokens: 500,
      },
    });

    const provider = new AnthropicProvider(
      anthropicApiKey,
      trackerApiKey,
      endpoint,
    );
    const params: MessagesParams = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: 'Hi' }],
    };

    await provider.messages(params);

    expect(mockMessagesCreate).toHaveBeenCalledWith(params);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${endpoint}/api/v1/log`,
      expect.objectContaining({
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        inputTokens: 1000,
        outputTokens: 500,
        timestamp: expect.any(Date),
      }),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': trackerApiKey,
        },
      }),
    );
    const loggedCost = mockedAxios.post.mock.calls[0][1].costUsd as number;
    expect(loggedCost).toBeCloseTo(0.0105);
  });

  it('should calculate cost correctly for Claude Sonnet', async () => {
    mockMessagesCreate.mockResolvedValue({
      usage: {
        input_tokens: 1000,
        output_tokens: 500,
      },
    });

    const provider = new AnthropicProvider(
      anthropicApiKey,
      trackerApiKey,
      endpoint,
    );
    const params: MessagesParams = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: 'Hi' }],
    };

    await provider.messages(params);

    const loggedCost = mockedAxios.post.mock.calls[0][1].costUsd as number;
    expect(loggedCost).toBeCloseTo(0.0105);
  });

  it('should skip logging when skipLogging is true', async () => {
    mockMessagesCreate.mockResolvedValue({
      usage: {
        input_tokens: 100,
        output_tokens: 50,
      },
    });

    const provider = new AnthropicProvider(
      anthropicApiKey,
      trackerApiKey,
      endpoint,
    );
    const params: MessagesParams = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: 'Hi' }],
    };

    await provider.messages(params, { skipLogging: true });

    expect(mockMessagesCreate).toHaveBeenCalledWith(params);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should include metadata in log', async () => {
    mockMessagesCreate.mockResolvedValue({
      usage: {
        input_tokens: 100,
        output_tokens: 50,
      },
    });

    const provider = new AnthropicProvider(
      anthropicApiKey,
      trackerApiKey,
      endpoint,
    );
    const params: MessagesParams = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: 'Hi' }],
    };

    await provider.messages(params, { metadata: { userId: '123' } });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${endpoint}/api/v1/log`,
      expect.objectContaining({
        metadata: { userId: '123' },
      }),
      expect.any(Object),
    );
  });

  it('should handle Anthropic API errors', async () => {
    mockMessagesCreate.mockRejectedValue(new Error('boom'));

    const provider = new AnthropicProvider(
      anthropicApiKey,
      trackerApiKey,
      endpoint,
    );
    const params: MessagesParams = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ role: 'user', content: 'Hi' }],
    };

    await expect(provider.messages(params)).rejects.toThrow('boom');
  });

  describe('Anthropic streaming', () => {
    it('should return an async iterable for stream: true', async () => {
      const mockEvents = [
        { type: 'message_start', message: { usage: { input_tokens: 100, output_tokens: 0 } } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
        { type: 'message_delta', usage: { output_tokens: 50 } },
        { type: 'message_stop' },
      ];

      const mockStream = async function* () {
        for (const event of mockEvents) yield event;
      };
      mockMessagesCreate.mockResolvedValue(mockStream());

      const provider = new AnthropicProvider(anthropicApiKey, trackerApiKey, endpoint);
      const result = await provider.messages({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: 'Hi' }],
        stream: true,
      } as MessagesParams);

      expect(Symbol.asyncIterator in (result as any)).toBe(true);

      const events: unknown[] = [];
      for await (const event of result as any) {
        events.push(event);
      }
      expect(events).toHaveLength(4);
    });

    it('should log cost after stream completes', async () => {
      const mockStream = async function* () {
        yield { type: 'message_start', message: { usage: { input_tokens: 100, output_tokens: 0 } } };
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hi' } };
        yield { type: 'message_delta', usage: { output_tokens: 50 } };
        yield { type: 'message_stop' };
      };
      mockMessagesCreate.mockResolvedValue(mockStream());

      const provider = new AnthropicProvider(anthropicApiKey, trackerApiKey, endpoint);
      const result = await provider.messages({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: 'Hi' }],
        stream: true,
      } as MessagesParams);

      for await (const _ of result as any) { /* consume */ }

      // claude-3-sonnet: (100 * $3 + 50 * $15) / 1_000_000 = $0.00105
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${endpoint}/api/v1/log`,
        expect.objectContaining({
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          inputTokens: 100,
          outputTokens: 50,
          costUsd: expect.closeTo(0.00105, 5),
        }),
        expect.any(Object),
      );
    });

    it('should not log when skipLogging is true', async () => {
      const mockStream = async function* () {
        yield { type: 'message_start', message: { usage: { input_tokens: 10, output_tokens: 0 } } };
        yield { type: 'message_stop' };
      };
      mockMessagesCreate.mockResolvedValue(mockStream());

      const provider = new AnthropicProvider(anthropicApiKey, trackerApiKey, endpoint);
      const result = await provider.messages(
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [{ role: 'user', content: 'Hi' }],
          stream: true,
        } as MessagesParams,
        { skipLogging: true },
      );

      for await (const _ of result as any) { /* consume */ }

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });
});
