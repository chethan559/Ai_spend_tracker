import axios from 'axios';

import GoogleProvider from '../providers/GoogleProvider';

const mockGenerateContent = jest.fn();
const mockGenerateContentStream = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent,
  generateContentStream: mockGenerateContentStream,
});

jest.mock('@google/generative-ai', () => ({
  __esModule: true,
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

describe('GoogleProvider', () => {
  const endpoint = 'https://tracker.example.com';
  const trackerApiKey = 'tracker-key';
  const googleApiKey = 'google-key';
  const mockedAxios = axios as unknown as { post: jest.Mock };
  type GenerateParams = Parameters<GoogleProvider['generateContent']>[1];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with API key', () => {
    const provider = new GoogleProvider(googleApiKey, trackerApiKey, endpoint);
    expect(provider).toBeInstanceOf(GoogleProvider);
  });

  it('should call Google Gemini API and log usage', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        usageMetadata: {
          promptTokenCount: 1000,
          candidatesTokenCount: 500,
          totalTokenCount: 1500,
        },
      },
    });

    const provider = new GoogleProvider(googleApiKey, trackerApiKey, endpoint);
    const params: GenerateParams = 'Hello';

    await provider.generateContent('gemini-pro', params);

    expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-pro' });
    expect(mockGenerateContent).toHaveBeenCalledWith(params);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${endpoint}/api/v1/log`,
      expect.objectContaining({
        provider: 'google',
        model: 'gemini-pro',
        inputTokens: 1000,
        outputTokens: 500,
        costUsd: 0.00125,
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

  it('should calculate cost correctly for Gemini Pro', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        usageMetadata: {
          promptTokenCount: 1000,
          candidatesTokenCount: 500,
          totalTokenCount: 1500,
        },
      },
    });

    const provider = new GoogleProvider(googleApiKey, trackerApiKey, endpoint);
    const params: GenerateParams = 'Hello';

    await provider.generateContent('gemini-pro', params);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${endpoint}/api/v1/log`,
      expect.objectContaining({
        costUsd: 0.00125,
      }),
      expect.any(Object),
    );
  });

  it('should skip logging when skipLogging is true', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        usageMetadata: {
          promptTokenCount: 100,
          candidatesTokenCount: 50,
          totalTokenCount: 150,
        },
      },
    });

    const provider = new GoogleProvider(googleApiKey, trackerApiKey, endpoint);
    const params: GenerateParams = 'Hello';

    await provider.generateContent('gemini-pro', params, { skipLogging: true });

    expect(mockGenerateContent).toHaveBeenCalledWith(params);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should include metadata in log', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        usageMetadata: {
          promptTokenCount: 100,
          candidatesTokenCount: 50,
          totalTokenCount: 150,
        },
      },
    });

    const provider = new GoogleProvider(googleApiKey, trackerApiKey, endpoint);
    const params: GenerateParams = 'Hello';

    await provider.generateContent('gemini-pro', params, {
      metadata: { feature: 'chatbot' },
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${endpoint}/api/v1/log`,
      expect.objectContaining({
        metadata: { feature: 'chatbot' },
      }),
      expect.any(Object),
    );
  });

  it('should handle Google API errors', async () => {
    mockGenerateContent.mockRejectedValue(new Error('boom'));

    const provider = new GoogleProvider(googleApiKey, trackerApiKey, endpoint);
    const params: GenerateParams = 'Hello';

    await expect(
      provider.generateContent('gemini-pro', params),
    ).rejects.toThrow('boom');
  });

  describe('Google streaming', () => {
    it('should return an async iterable for stream: true', async () => {
      const mockChunks = [
        { usageMetadata: { promptTokenCount: 0, candidatesTokenCount: 0 } },
        { usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 30 } },
        { usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50 } },
      ];

      const mockStream = async function* () {
        for (const chunk of mockChunks) yield chunk;
      };
      mockGenerateContentStream.mockResolvedValue(mockStream());

      const provider = new GoogleProvider(googleApiKey, trackerApiKey, endpoint);
      const result = await provider.generateContent('gemini-pro', {
        stream: true,
        contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
      } as GenerateParams);

      expect(Symbol.asyncIterator in (result as any)).toBe(true);

      const chunks: unknown[] = [];
      for await (const chunk of result as any) {
        chunks.push(chunk);
      }
      expect(chunks).toHaveLength(3);
    });

    it('should log cost after stream completes', async () => {
      const mockStream = async function* () {
        yield { usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 20 } };
        yield { usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50 } };
      };
      mockGenerateContentStream.mockResolvedValue(mockStream());

      const provider = new GoogleProvider(googleApiKey, trackerApiKey, endpoint);
      const result = await provider.generateContent(
        'gemini-pro',
        { stream: true, contents: [{ role: 'user', parts: [{ text: 'Hi' }] }] } as GenerateParams,
        { metadata: { feature: 'stream-test' } },
      );

      for await (const _ of result as any) { /* consume */ }

      // gemini-pro: (100 * $0.50 + 50 * $1.50) / 1_000_000 = $0.000125
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${endpoint}/api/v1/log`,
        expect.objectContaining({
          provider: 'google',
          model: 'gemini-pro',
          inputTokens: 100,
          outputTokens: 50,
          costUsd: expect.closeTo(0.000125, 6),
        }),
        expect.any(Object),
      );
    });

    it('should not log when skipLogging is true', async () => {
      const mockStream = async function* () {
        yield { usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } };
      };
      mockGenerateContentStream.mockResolvedValue(mockStream());

      const provider = new GoogleProvider(googleApiKey, trackerApiKey, endpoint);
      const result = await provider.generateContent(
        'gemini-pro',
        { stream: true, contents: [{ role: 'user', parts: [{ text: 'Hi' }] }] } as GenerateParams,
        { skipLogging: true },
      );

      for await (const _ of result as any) { /* consume */ }

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });
});
