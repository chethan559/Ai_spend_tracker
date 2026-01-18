jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));
const MAX_QUEUE_SIZE = 1000;

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('Logger Retry Queue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should add failed requests to queue', async () => {
    const mockedAxios = jest.requireMock('axios').default as { post: jest.Mock };
    mockedAxios.post.mockRejectedValue(new Error('fail'));
    const { logToBackend, getQueueSize } = await import('../utils/logger');

    logToBackend('https://api.example.com', 'key', {
      provider: 'openai',
      model: 'gpt-4',
      tokens: 1,
      cost: 0.01,
      timestamp: new Date(),
    });

    await flushPromises();
    expect(getQueueSize()).toBeGreaterThan(0);
  });

  it('should not exceed MAX_QUEUE_SIZE', async () => {
    const mockedAxios = jest.requireMock('axios').default as { post: jest.Mock };
    mockedAxios.post.mockRejectedValue(new Error('fail'));
    const { logToBackend, getQueueSize } = await import('../utils/logger');

    for (let i = 0; i < MAX_QUEUE_SIZE + 100; i += 1) {
      logToBackend('https://api.example.com', 'key', {
        provider: 'openai',
        model: 'gpt-4',
        tokens: i,
        cost: 0.01,
        timestamp: new Date(),
      });
    }

    await flushPromises();
    expect(getQueueSize()).toBe(MAX_QUEUE_SIZE);
  });

  it('should retry queued items', async () => {
    const mockedAxios = jest.requireMock('axios').default as { post: jest.Mock };
    mockedAxios.post
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({});
    const { logToBackend, getQueueSize } = await import('../utils/logger');

    logToBackend('https://api.example.com', 'key', {
      provider: 'openai',
      model: 'gpt-4',
      tokens: 1,
      cost: 0.01,
      timestamp: new Date(),
    });

    await flushPromises();
    expect(getQueueSize()).toBe(1);

    jest.advanceTimersByTime(60_000);
    await flushPromises();

    expect(getQueueSize()).toBe(0);
  });

  it('should remove items after MAX_RETRIES', async () => {
    const mockedAxios = jest.requireMock('axios').default as { post: jest.Mock };
    mockedAxios.post.mockRejectedValue(new Error('fail'));
    const { logToBackend, getQueueSize } = await import('../utils/logger');

    logToBackend('https://api.example.com', 'key', {
      provider: 'openai',
      model: 'gpt-4',
      tokens: 1,
      cost: 0.01,
      timestamp: new Date(),
    });

    await flushPromises();
    expect(getQueueSize()).toBe(1);

    for (let i = 0; i < 3; i += 1) {
      jest.advanceTimersByTime(60_000);
      await flushPromises();
    }

    expect(getQueueSize()).toBe(0);
  });
});

