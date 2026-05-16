/**
 * AI Spend Tracker SDK
 * Track and optimize your AI API costs
 */
import AnthropicProvider from './providers/AnthropicProvider';
import GoogleProvider from './providers/GoogleProvider';
import GroqProvider from './providers/GroqProvider';
import OpenAIProvider from './providers/OpenAIProvider';
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

  /**
   * Initialize the OpenAI provider for this tracker instance.
   */
  initOpenAI(openaiApiKey: string): this {
    this.openaiProvider = new OpenAIProvider(
      openaiApiKey,
      this.apiKey,
      this.endpoint,
    );
    return this;
  }

  /**
   * Initialize the Anthropic provider for this tracker instance.
   */
  initAnthropic(anthropicApiKey: string): this {
    this.anthropicProvider = new AnthropicProvider(
      anthropicApiKey,
      this.apiKey,
      this.endpoint,
    );
    return this;
  }

  /**
   * Initialize the Google provider for this tracker instance.
   */
  initGoogle(googleApiKey: string): this {
    this.googleProvider = new GoogleProvider(
      googleApiKey,
      this.apiKey,
      this.endpoint,
    );
    return this;
  }

  /**
   * Initialize the Groq provider for this tracker instance.
   */
  initGroq(groqApiKey: string): this {
    this.groqProvider = new GroqProvider(groqApiKey, this.apiKey, this.endpoint);
    return this;
  }

  /**
   * Access OpenAI chat and embeddings helpers.
   */
  get openai() {
    if (!this.openaiProvider) {
      throw new Error(
        'OpenAI not initialized. Call initOpenAI(apiKey) first.',
      );
    }

    return {
      chat: (params: OpenAIChatParams, options?: OpenAIWrapperOptions) =>
        this.openaiProvider!.chat(params, options),
      embeddings: (
        params: OpenAIEmbeddingsParams,
        options?: OpenAIWrapperOptions,
      ) => this.openaiProvider!.embeddings(params, options),
    };
  }

  /**
   * Access Anthropic messages helper.
   */
  get anthropic() {
    if (!this.anthropicProvider) {
      throw new Error(
        'Anthropic not initialized. Call initAnthropic(apiKey) first.',
      );
    }

    return {
      messages: (
        params: AnthropicMessagesParams,
        options?: ProviderWrapperOptions,
      ) => this.anthropicProvider!.messages(params, options),
    };
  }

  /**
   * Access Google Gemini generateContent helper.
   */
  get google() {
    if (!this.googleProvider) {
      throw new Error(
        'Google not initialized. Call initGoogle(apiKey) first.',
      );
    }

    return {
      generateContent: (
        modelName: string,
        params: GoogleGenerateParams,
        options?: ProviderWrapperOptions,
      ) => this.googleProvider!.generateContent(modelName, params, options),
    };
  }

  /**
   * Access Groq chat helper.
   */
  get groq() {
    if (!this.groqProvider) {
      throw new Error('Groq not initialized. Call initGroq(apiKey) first.');
    }

    return {
      chat: (params: GroqChatParams, options?: OpenAIWrapperOptions) =>
        this.groqProvider!.chat(params, options),
    };
  }

  /**
   * Log an arbitrary AI call directly to the tracker backend.
   * Use this for providers without a dedicated wrapper (e.g. Groq via raw fetch,
   * Cohere, Mistral, etc.). cost is auto-calculated from tokens when omitted.
   */
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

  /**
   * Get the normalized endpoint used by the tracker.
   */
  getEndpoint(): string {
    return this.endpoint;
  }
}

export default AISpendTracker;

