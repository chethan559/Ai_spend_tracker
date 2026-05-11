import OpenAI from 'openai';

import { logToBackend } from '../utils/logger';
import { calculateCost } from '../utils/pricing';
import type { OpenAIWrapperOptions, OpenAIUsage } from '../types';

type OpenAIClient = InstanceType<typeof OpenAI>;
type ChatCreateParams = Parameters<OpenAIClient['chat']['completions']['create']>[0];
type EmbeddingsCreateParams =
  Parameters<OpenAIClient['embeddings']['create']>[0];

export class OpenAIProvider {
  private client: OpenAI;
  private trackerApiKey: string;
  private endpoint: string;

  private getModelName(params: { model?: string }): string {
    return params.model ?? 'unknown';
  }

  constructor(openaiApiKey: string, trackerApiKey: string, endpoint: string) {
    this.client = new OpenAI({ apiKey: openaiApiKey });
    this.trackerApiKey = trackerApiKey;
    this.endpoint = endpoint;
  }

  async chat(
    params: ChatCreateParams,
    options: OpenAIWrapperOptions = {},
  ): Promise<unknown> {
    const startTime = Date.now();
    const { metadata, ...openaiParams } = params as any;

    if (!(params as any).stream) {
      // NON-STREAMING — existing behaviour unchanged
      try {
        const response = await this.client.chat.completions.create(openaiParams);
        const latencyMs = Date.now() - startTime;
        const usage = (response as { usage?: OpenAIUsage }).usage;

        const inputTokens = usage?.prompt_tokens ?? 0;
        const outputTokens = usage?.completion_tokens ?? 0;
        const model = this.getModelName(params);

        const { cost } = calculateCost('openai', model, inputTokens, outputTokens);

        if (!options.skipLogging) {
          logToBackend(this.endpoint, this.trackerApiKey, {
            provider: 'openai',
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
        console.error('OpenAIProvider chat failed:', error);
        throw error;
      }
    }

    // STREAMING — stream_options.include_usage ensures usage arrives in the final chunk
    try {
      const streamParams = { ...openaiParams, stream_options: { include_usage: true } };
      const stream = await this.client.chat.completions.create(streamParams) as unknown as AsyncIterable<any>;
      return this.wrapOpenAIStream(stream, this.getModelName(params), startTime, options);
    } catch (error) {
      console.error('OpenAIProvider chat (stream) failed:', error);
      throw error;
    }
  }

  private async *wrapOpenAIStream(
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
      const { cost } = calculateCost('openai', model, inputTokens, outputTokens);
      logToBackend(this.endpoint, this.trackerApiKey, {
        provider: 'openai',
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

  async embeddings(
    params: EmbeddingsCreateParams,
    options: OpenAIWrapperOptions = {},
  ): Promise<unknown> {
    const startTime = Date.now();
    try {
      const response = await this.client.embeddings.create(params);
      const latencyMs = Date.now() - startTime;
      const usage = (response as {
        usage?: { prompt_tokens?: number; total_tokens?: number };
      }).usage;

      const inputTokens = usage?.prompt_tokens ?? usage?.total_tokens ?? 0;
      const model = this.getModelName(params);

      const { cost } = calculateCost('openai', model, inputTokens, 0);

      if (!options.skipLogging) {
        await logToBackend(this.endpoint, this.trackerApiKey, {
          provider: 'openai',
          model,
          inputTokens,
          outputTokens: 0,
          latencyMs,
          cost,
          metadata: options.metadata,
          timestamp: new Date(),
        });
      }

      return response;
    } catch (error) {
      console.error('OpenAIProvider embeddings failed:', error);
      throw error;
    }
  }
}

export default OpenAIProvider;
