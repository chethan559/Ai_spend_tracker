/**
 * AI Spend Tracker SDK
 * Track and optimize your AI API costs
 */
import type AnthropicProvider from './providers/AnthropicProvider';
import type GoogleProvider from './providers/GoogleProvider';
import type GroqProvider from './providers/GroqProvider';
import type OpenAIProvider from './providers/OpenAIProvider';
import { logToBackend } from './utils/logger';
import { calculateCost } from './utils/pricing';
import { normalizeEndpoint } from './utils/url';
import type { LogPayload, OpenAIWrapperOptions, ProviderWrapperOptions, SDKOptions } from './types';

type OpenAIChatParams = Parameters<OpenAIProvider['chat']>[0];
type OpenAIEmbeddingsParams = Parameters<OpenAIProvider['embeddings']>[0];
type AnthropicMessagesParams = Parameters<AnthropicProvider['messages']>[0];
type GoogleGenerateParams = Parameters<GoogleProvider['generateContent']>[1];
type GroqChatParams = Parameters<GroqProvider['chat']>[0];

export class AISpendTracker {
  private apiKey: string;
  private endpoint: string;
  private openaiProvider?: OpenAIProvider;
  private anthropicProvider?: AnthropicProvider;
  private googleProvider?: GoogleProvider;
  private groqProvider?: GroqProvider;

  constructor(apiKey: string, options: SDKOptions = {}) {
    this.apiKey = apiKey;
    this.endpoint = options.endpoint
      ? normalizeEndpoint(options.endpoint)
      : 'https://api.aispendtracker.com';
  }

  initOpenAI(openaiApiKey: string): this {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Cls = (require('./providers/OpenAIProvider') as { default: typeof OpenAIProvider }).default;
    this.openaiProvider = new Cls(openaiApiKey, this.apiKey, this.endpoint);
    return this;
  }

  initAnthropic(anthropicApiKey: string): this {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Cls = (require('./providers/AnthropicProvider') as { default: typeof AnthropicProvider }).default;
    this.anthropicProvider = new Cls(anthropicApiKey, this.apiKey, this.endpoint);
    return this;
  }

  initGoogle(googleApiKey: string): this {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Cls = (require('./providers/GoogleProvider') as { default: typeof GoogleProvider }).default;
    this.googleProvider = new Cls(googleApiKey, this.apiKey, this.endpoint);
    return this;
  }

  initGroq(groqApiKey: string): this {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Cls = (require('./providers/GroqProvider') as { default: typeof GroqProvider }).default;
    this.groqProvider = new Cls(groqApiKey, this.apiKey, this.endpoint);
    return this;
  }

  get openai() {
    if (!this.openaiProvider) {
      throw new Error('OpenAI not initialized. Call initOpenAI(apiKey) first.');
    }

    return {
      chat: (params: OpenAIChatParams, options?: OpenAIWrapperOptions) =>
        this.openaiProvider!.chat(params, options),
      embeddings: (params: OpenAIEmbeddingsParams, options?: OpenAIWrapperOptions) =>
        this.openaiProvider!.embeddings(params, options),
    };
  }

  get anthropic() {
    if (!this.anthropicProvider) {
      throw new Error('Anthropic not initialized. Call initAnthropic(apiKey) first.');
    }

    return {
      messages: (params: AnthropicMessagesParams, options?: ProviderWrapperOptions) =>
        this.anthropicProvider!.messages(params, options),
    };
  }

  get google() {
    if (!this.googleProvider) {
      throw new Error('Google not initialized. Call initGoogle(apiKey) first.');
    }

    return {
      generateContent: (
        modelName: string,
        params: GoogleGenerateParams,
        options?: ProviderWrapperOptions,
      ) => this.googleProvider!.generateContent(modelName, params, options),
    };
  }

  get groq() {
    if (!this.groqProvider) {
      throw new Error('Groq not initialized. Call initGroq(apiKey) first.');
    }

    return {
      chat: (params: GroqChatParams, options?: OpenAIWrapperOptions) =>
        this.groqProvider!.chat(params, options),
    };
  }

  log(payload: LogPayload): void {
    const { cost, timestamp, ...rest } = payload;
    const resolvedCost =
      cost ?? calculateCost(rest.provider, rest.model, rest.inputTokens, rest.outputTokens).cost;

    logToBackend(this.endpoint, this.apiKey, {
      ...rest,
      cost: resolvedCost,
      timestamp: timestamp ?? new Date(),
    });
  }

  getVersion(): string {
    return '0.1.0';
  }

  getEndpoint(): string {
    return this.endpoint;
  }
}

export default AISpendTracker;
