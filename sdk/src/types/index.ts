/**
 * Supported AI providers for the spend tracking SDK.
 */
export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'cohere'
  | 'replicate';

/**
 * Optional metadata for log entries with support for custom fields.
 */
export interface LogMetadata {
  userId?: string;
  feature?: string;
  environment?: string;
  // Custom fields can be any shape provided by the caller.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * OpenAI usage information returned by the API.
 */
export interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Anthropic usage information returned by the API.
 */
export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

/**
 * Google usage information returned by the API.
 */
export interface GoogleUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

/**
 * Shared options for provider wrappers.
 */
export interface ProviderWrapperOptions {
  metadata?: LogMetadata;
  skipLogging?: boolean;
}

/**
 * Options for the OpenAI wrapper integration.
 */
export type OpenAIWrapperOptions = ProviderWrapperOptions;

/**
 * Log entry for API usage, including cost and token details.
 */
export interface ApiLog {
  provider: AIProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs?: number;
  cost: number;
  metadata?: LogMetadata;
  timestamp: Date;
}

/**
 * SDK configuration options.
 */
export interface SDKOptions {
  endpoint?: string;
  debug?: boolean;
}

