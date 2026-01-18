import axios from 'axios';

import GoogleProvider from '../providers/GoogleProvider';

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn().mockReturnValue({
  generateContent: mockGenerateContent,
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
        tokens: 1500,
        cost: 0.00125,
        timestamp: expect.any(Date),
      }),
      expect.objectContaining({
        headers: {
          Authorization: `Bearer ${trackerApiKey}`,
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
        cost: 0.00125,
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
});

