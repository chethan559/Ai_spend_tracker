import OpenAI from 'openai';

import { logToBackend } from '../utils/logger';
import { calculateCost } from '../utils/pricing';
import type { OpenAIWrapperOptions, OpenAIUsage } from '../types';

// Groq exposes an OpenAI-compatible API at this base URL.
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

type OpenAIClient = InstanceType<typeof OpenAI>;
type ChatCreateParams = Parameters<OpenAIClient['chat']['completions']['create']>[0];

export class GroqProvider {
  private client: OpenAI;
  private trackerApiKey: string;
  private endpoint: string;

  constructor(groqApiKey: string, trackerApiKey: string, endpoint: string) {
    this.client = new OpenAI({ apiKey: groqApiKey, baseURL: GROQ_BASE_URL });
    this.trackerApiKey = trackerApiKey;
    this.endpoint = endpoint;
  }

  async chat(
    params: ChatCreateParams,
    options: OpenAIWrapperOptions = {},
  ): Promise<unknown> {
    const startTime = Date.now();
    const { metadata: _meta, ...groqParams } = params as any;
    const model = (params as any).model ?? 'unknown';

    if (!(params as any).stream) {
      try {
        const response = await this.client.chat.completions.create(groqParams);
        const latencyMs = Date.now() - startTime;
        const usage = (response as { usage?: OpenAIUsage }).usage;

        const inputTokens = usage?.prompt_tokens ?? 0;
        const outputTokens = usage?.completion_tokens ?? 0;
        const { cost } = calculateCost('groq', model, inputTokens, outputTokens);

        if (!options.skipLogging) {
          logToBackend(this.endpoint, this.trackerApiKey, {
            provider: 'groq',
            model,
            inputTokens,
            outputTokens,
            latencyMs,
            cost,
            metadata: options.metadata,
            timestamp: new Date(),
          });
        }

        return response;
      } catch (error) {
        console.error('GroqProvider chat failed:', error);
        throw error;
      }
    }

    try {
      const streamParams = { ...groqParams, stream_options: { include_usage: true } };
      const stream = await this.client.chat.completions.create(streamParams) as unknown as AsyncIterable<any>;
      return this.wrapStream(stream, model, startTime, options);
    } catch (error) {
      console.error('GroqProvider chat (stream) failed:', error);
      throw error;
    }
  }

  private async *wrapStream(
    stream: AsyncIterable<any>,
    model: string,
    startTime: number,
    options: OpenAIWrapperOptions,
  ): AsyncGenerator<any> {
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of stream) {
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens ?? 0;
        outputTokens = chunk.usage.completion_tokens ?? 0;
      }
      yield chunk;
    }

    if (!options.skipLogging) {
      const { cost } = calculateCost('groq', model, inputTokens, outputTokens);
      logToBackend(this.endpoint, this.trackerApiKey, {
        provider: 'groq',
        model,
        inputTokens,
        outputTokens,
        latencyMs: Date.now() - startTime,
        cost,
        metadata: options.metadata,
        timestamp: new Date(),
      });
    }
  }
}

export default GroqProvider;
