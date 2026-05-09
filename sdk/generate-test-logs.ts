import { AISpendTracker } from './src/index';

async function generateTestLogs() {
  const apiKey = process.env.TRACKER_API_KEY || 'YOUR_API_KEY';

  const tracker = new AISpendTracker(apiKey, {
    endpoint: 'http://localhost:3001',
  });

  // Simulate logs over past 30 days
  const providers = ['openai', 'anthropic', 'google'] as const;
  const models: Record<(typeof providers)[number], string[]> = {
    openai: ['gpt-4', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-opus', 'claude-3-sonnet'],
    google: ['gemini-pro'],
  };

  const logs: Array<{
    provider: (typeof providers)[number];
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    timestamp: string;
    metadata: { feature: string };
  }> = [];

  for (let i = 0; i < 30; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // 5-10 logs per day
    const logsPerDay = Math.floor(Math.random() * 6) + 5;

    for (let j = 0; j < logsPerDay; j += 1) {
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const providerModels = models[provider];
      const model =
        providerModels[Math.floor(Math.random() * providerModels.length)];
      const inputTokens = Math.floor(Math.random() * 2000) + 300;
      const outputTokens = Math.floor(Math.random() * 1000) + 100;
      const totalTokens = inputTokens + outputTokens;
      const cost = (totalTokens / 1_000_000) * (Math.random() * 50 + 5);

      logs.push({
        provider,
        model,
        inputTokens,
        outputTokens,
        cost: Number(cost.toFixed(4)),
        timestamp: date.toISOString(),
        metadata: {
          feature: ['chatbot', 'summarizer', 'content-gen'][
            Math.floor(Math.random() * 3)
          ],
        },
      });
    }
  }

  // Send in batches
  const batchSize = 100;
  for (let i = 0; i < logs.length; i += batchSize) {
    const batch = logs.slice(i, i + batchSize);
    await fetch('http://localhost:3001/api/v1/log/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(batch),
    });
    console.log(`Sent batch ${i / batchSize + 1}`);
  }

  console.log(`✅ Generated ${logs.length} test logs`);
}

generateTestLogs();
