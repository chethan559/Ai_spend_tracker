# AI Spend Tracker SDK

Track and optimize your AI API costs across providers.

## Installation

```sh
npm install ai-spend-tracker
```

## Quick Start

```ts
import AISpendTracker from 'ai-spend-tracker';

const sdk = new AISpendTracker('your-api-key');
console.log(sdk.getVersion());
```

## Usage

### Tracking OpenAI Costs

```ts
import { AISpendTracker } from 'ai-spend-tracker';

// Initialize tracker
const tracker = new AISpendTracker('your-tracker-api-key');

// Initialize OpenAI
tracker.initOpenAI('your-openai-api-key');

// Make API calls - automatically tracked
const response = await tracker.openai.chat(
  {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello, how are you?' }],
  },
  {
    metadata: {
      userId: '123',
      feature: 'chatbot',
    },
  },
);
```

### Tracking Embeddings

```ts
import { AISpendTracker } from 'ai-spend-tracker';

const tracker = new AISpendTracker('your-tracker-api-key');
tracker.initOpenAI('your-openai-api-key');

const response = await tracker.openai.embeddings(
  {
    model: 'text-embedding-3-small',
    input: 'Hello embeddings',
  },
  {
    metadata: {
      userId: '123',
      feature: 'semantic-search',
    },
  },
);
```

### Tracking Anthropic Costs

```ts
tracker.initAnthropic('your-anthropic-key');

const response = await tracker.anthropic.messages(
  {
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello!' }],
  },
  {
    metadata: { userId: '123' },
  },
);
```

### Tracking Google Gemini Costs

```ts
tracker.initGoogle('your-google-key');

const response = await tracker.google.generateContent(
  'gemini-pro',
  'Write a haiku',
  {
    metadata: { feature: 'content-gen' },
  },
);
```

### Skip Logging

```ts
import { AISpendTracker } from 'ai-spend-tracker';

const tracker = new AISpendTracker('your-tracker-api-key');
tracker.initOpenAI('your-openai-api-key');

await tracker.openai.chat(
  {
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'No logging for this request' }],
  },
  {
    skipLogging: true,
  },
);
```

### Using Multiple Providers

```ts
const tracker = new AISpendTracker('your-tracker-api-key');

tracker.initOpenAI('your-openai-key');
tracker.initAnthropic('your-anthropic-key');
tracker.initGoogle('your-google-key');

await tracker.openai.chat({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello from OpenAI' }],
});

await tracker.anthropic.messages({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 256,
  messages: [{ role: 'user', content: 'Hello from Anthropic' }],
});

await tracker.google.generateContent('gemini-pro', 'Hello from Google');
```

### Metadata Tagging

Use `metadata` to attach user, feature, environment, or any custom fields to
each log entry. This helps you filter and aggregate costs across products and
teams in your backend analytics.

### Offline Queue

If a log request fails, it is queued in memory and retried in the background
every 60 seconds up to a few attempts. This keeps SDK calls non-blocking while
still delivering logs when transient network issues occur.

## Development

- `npm install`: install dependencies
- `npm run build`: build the SDK
- `npm test`: run the test suite
- `npm run test:watch`: run tests in watch mode
- `npm run type-check`: run TypeScript type checks
- `npm run lint`: run ESLint
- `npm run format`: run Prettier

## Project Structure

```
src/
├── __tests__/
├── providers/
├── types/
└── utils/
```

## License

MIT

# Ai_spend_tracker
