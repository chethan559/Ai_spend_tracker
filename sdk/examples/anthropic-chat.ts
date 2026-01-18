import { AISpendTracker } from '../src/index';

async function main() {
  // Initialize tracker with your AI Spend Tracker API key.
  const tracker = new AISpendTracker(
    process.env.TRACKER_API_KEY || 'test-key',
  );

  // Initialize Anthropic with your API key.
  tracker.initAnthropic(process.env.ANTHROPIC_API_KEY || 'your-key');

  // Send a messages request to Claude and include metadata for tracking.
  const response = await tracker.anthropic.messages(
    {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Hello, Claude!' }],
    },
    {
      metadata: {
        userId: '123',
        feature: 'chatbot',
      },
    },
  );

  // Print the assistant reply from the response content blocks.
  console.log(response.content[0].text);
}

// Run the example.
main().catch((error) => {
  console.error('Example failed:', error);
});

