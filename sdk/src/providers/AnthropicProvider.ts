import Anthropic from '@anthropic-ai/sdk';

import { logToBackend } from '../utils/logger';
import { calculateCost } from '../utils/pricing';
import type { AnthropicUsage, ProviderWrapperOptions } from '../types';

type AnthropicClient = InstanceType<typeof Anthropic>;
type MessagesCreateParams =
  Parameters<AnthropicClient['messages']['create']>[0];

export class AnthropicProvider {
  private client: Anthropic;
  private trackerApiKey: string;
  private endpoint: string;

  constructor(anthropicApiKey: string, trackerApiKey: string, endpoint: string) {
    this.client = new Anthropic({ apiKey: anthropicApiKey });
    this.trackerApiKey = trackerApiKey;
    this.endpoint = endpoint;
  }

  async messages(
    params: MessagesCreateParams,
    options: ProviderWrapperOptions = {},
  ): Promise<unknown> {
    const startTime = Date.now();
    const { metadata, ...anthropicParams } = params as any;

    if (!(params as any).stream) {
      // NON-STREAMING — existing behaviour unchanged
      try {
        const response = await this.client.messages.create(anthropicParams);
        const latencyMs = Date.now() - startTime;
        const usage = (response as { usage?: AnthropicUsage }).usage;

        const inputTokens = usage?.input_tokens ?? 0;
        const outputTokens = usage?.output_tokens ?? 0;
        const model = params.model ?? 'unknown';

        const { cost } = calculateCost('anthropic', model, inputTokens, outputTokens);

        if (!options.skipLogging) {
          logToBackend(this.endpoint, this.trackerApiKey, {
            provider: 'anthropic',
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
        console.error('AnthropicProvider messages failed:', error);
        throw error;
      }
    }

    // STREAMING
    try {
      const stream = await this.client.messages.create(anthropicParams) as unknown as AsyncIterable<any>;
      return this.wrapAnthropicStream(stream, params.model ?? 'unknown', startTime, options);
    } catch (error) {
      console.error('AnthropicProvider messages (stream) failed:', error);
      throw error;
    }
  }

  private async *wrapAnthropicStream(
    stream: AsyncIterable<any>,
    model: string,
    startTime: number,
    options: ProviderWrapperOptions,
  ): AsyncGenerator<any> {
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const event of stream) {
      // Input tokens arrive in message_start
      if (event.type === 'message_start' && event.message?.usage) {
        inputTokens = event.message.usage.input_tokens ?? 0;
      }
      // Output tokens accumulate in message_delta
      if (event.type === 'message_delta' && event.usage) {
        outputTokens = event.usage.output_tokens ?? 0;
      }
      yield event;
    }

    if (!options.skipLogging) {
      const { cost } = calculateCost('anthropic', model, inputTokens, outputTokens);
      logToBackend(this.endpoint, this.trackerApiKey, {
        provider: 'anthropic',
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

export default AnthropicProvider;
