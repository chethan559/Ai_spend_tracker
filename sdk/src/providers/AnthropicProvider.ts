import Anthropic from '@anthropic-ai/sdk';

import { logToBackend } from '../utils/logger';
import { calculateAnthropicCost } from '../utils/pricing';
import type { AnthropicUsage, ProviderWrapperOptions } from '../types';

type AnthropicClient = InstanceType<typeof Anthropic>;
type MessagesCreateParams =
  Parameters<AnthropicClient['messages']['create']>[0];

/**
 * Wrapper for Anthropic API calls with cost tracking and logging.
 *
 * Anthropic messages are passed as an array of content blocks:
 * [{ role: 'user' | 'assistant', content: string | Array<{ type: string; text?: string }> }]
 */
export class AnthropicProvider {
  private client: Anthropic;
  private trackerApiKey: string;
  private endpoint: string;

  /**
   * Create an Anthropic provider with API keys and tracking endpoint.
   */
  constructor(anthropicApiKey: string, trackerApiKey: string, endpoint: string) {
    this.client = new Anthropic({ apiKey: anthropicApiKey });
    this.trackerApiKey = trackerApiKey;
    this.endpoint = endpoint;
  }

  /**
   * Send a messages request and optionally log usage to the tracker.
   */
  async messages(
    params: MessagesCreateParams,
    options: ProviderWrapperOptions = {},
  ): Promise<unknown> {
    try {
      const response = await this.client.messages.create(params);
      const usage = (response as { usage?: AnthropicUsage }).usage;

      const inputTokens = usage?.input_tokens ?? 0;
      const outputTokens = usage?.output_tokens ?? 0;
      const totalTokens = inputTokens + outputTokens;
      const model = params.model ?? 'unknown';

      const cost = calculateAnthropicCost(model, inputTokens, outputTokens);

      if (!options.skipLogging) {
        logToBackend(this.endpoint, this.trackerApiKey, {
          provider: 'anthropic',
          model,
          tokens: totalTokens,
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

