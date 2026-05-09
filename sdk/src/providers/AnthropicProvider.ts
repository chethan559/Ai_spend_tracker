import Anthropic from '@anthropic-ai/sdk';

import { logToBackend } from '../utils/logger';
import { calculateAnthropicCost } from '../utils/pricing';
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
    try {
      const response = await this.client.messages.create(params);
      const latencyMs = Date.now() - startTime;
      const usage = (response as { usage?: AnthropicUsage }).usage;

      const inputTokens = usage?.input_tokens ?? 0;
      const outputTokens = usage?.output_tokens ?? 0;
      const model = params.model ?? 'unknown';

      const cost = calculateAnthropicCost(model, inputTokens, outputTokens);

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
}

export default AnthropicProvider;
