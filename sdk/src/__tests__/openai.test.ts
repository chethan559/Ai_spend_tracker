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
        cost: 0.06,
        timestamp: expect.any(Date),
      }),
      expect.objectContaining({
        headers: {
          Authorization: `Bearer ${trackerApiKey}`,
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
});
