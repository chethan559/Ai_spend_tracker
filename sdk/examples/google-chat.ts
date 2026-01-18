import { AISpendTracker } from '../src/index';

async function main() {
  // Initialize tracker with your AI Spend Tracker API key.
  const tracker = new AISpendTracker(
    process.env.TRACKER_API_KEY || 'test-key',
  );

  // Initialize Google Gemini with your API key.
  tracker.initGoogle(process.env.GOOGLE_API_KEY || 'your-key');

  // Generate content with tracking enabled and metadata attached.
  const response = await tracker.google.generateContent(
    'gemini-pro',
    'Tell me a short joke',
    {
      metadata: {
        userId: '456',
        feature: 'content-gen',
      },
    },
  );

  // Print the generated text.
  console.log(response.response.text());
}

// Run the example.
main().catch((error) => {
  console.error('Example failed:', error);
});

