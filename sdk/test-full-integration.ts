import { AISpendTracker } from './src/index';

async function test() {
  // Initialize tracker with your backend API key.
  const tracker = new AISpendTracker('YOUR_API_KEY', {
    endpoint: 'http://localhost:3001',
  });

  // Initialize OpenAI (requires a real API key).
  tracker.initOpenAI(process.env.OPENAI_API_KEY || 'sk-...');

  try {
    console.log('Making OpenAI API call...');

    const response = await tracker.openai.chat(
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say hello in 5 words' }],
      },
      {
        metadata: {
          userId: 'test-user',
          feature: 'integration-test',
        },
      },
    );

    console.log('Response:', response.choices[0].message.content);
    console.log('✅ Log sent to backend!');

    // Wait a moment for log to be processed.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('Check your backend - you should see a new log!');
    console.log('Run: npx prisma studio (in backend folder)');
  } catch (error) {
    console.error('Error:', error);
  }
}

test();

