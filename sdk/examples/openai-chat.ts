import { AISpendTracker } from '../src/index';

async function main() {
  // Initialize tracker with your AI Spend Tracker API key.
  const tracker = new AISpendTracker(
    process.env.TRACKER_API_KEY || 'your-tracker-api-key',
  );

  // Initialize OpenAI with your OpenAI API key.
  tracker.initOpenAI(process.env.OPENAI_API_KEY || 'your-openai-api-key');

  // Make a chat completion call with tracking enabled.
  const response = await tracker.openai.chat(
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello from the SDK example!' }],
    },
    {
      metadata: {
        userId: 'user-123',
        feature: 'examples/openai-chat',
      },
    },
  );

  // Print the assistant reply from the OpenAI response.
  console.log(response.choices[0].message.content);
}

// Run the example.
main().catch((error) => {
  console.error('Example failed:', error);
});

