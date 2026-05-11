import { GoogleGenerativeAI } from '@google/generative-ai';

import { logToBackend } from '../utils/logger';
import { calculateCost } from '../utils/pricing';
import type { GoogleUsage, ProviderWrapperOptions } from '../types';

type GenerativeModel = ReturnType<GoogleGenerativeAI['getGenerativeModel']>;
type GenerateContentParams = Parameters<GenerativeModel['generateContent']>[0];

export class GoogleProvider {
  private genAI: GoogleGenerativeAI;
  private trackerApiKey: string;
  private endpoint: string;

  constructor(googleApiKey: string, trackerApiKey: string, endpoint: string) {
    this.genAI = new GoogleGenerativeAI(googleApiKey);
    this.trackerApiKey = trackerApiKey;
    this.endpoint = endpoint;
  }

  async generateContent(
    modelName: string,
    params: GenerateContentParams,
    options: ProviderWrapperOptions = {},
  ): Promise<unknown> {
    const startTime = Date.now();

    // Only object params can carry the stream flag
    const paramsObj = (typeof params === 'object' && params !== null) ? params as unknown as Record<string, unknown> : null;
    const isStream = !!paramsObj?.stream;

    if (!isStream) {
      // NON-STREAMING — existing behaviour unchanged
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const response = await model.generateContent(params);
        const latencyMs = Date.now() - startTime;

        const usage = (response.response as { usageMetadata?: GoogleUsage }).usageMetadata;
        const inputTokens = usage?.promptTokenCount ?? 0;
        const outputTokens = usage?.candidatesTokenCount ?? 0;

        const { cost } = calculateCost('google', modelName, inputTokens, outputTokens);

        if (!options.skipLogging) {
          logToBackend(this.endpoint, this.trackerApiKey, {
            provider: 'google',
            model: modelName,
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
        console.error('GoogleProvider generateContent failed:', error);
        throw error;
      }
    }

    // STREAMING — strip 'stream' flag before forwarding to Google API
    try {
      const { stream: _s, metadata: _m, ...contentParams } = paramsObj as any;
      const model = this.genAI.getGenerativeModel({ model: modelName });
      const streamResult = await (model as any).generateContentStream(contentParams) as unknown as AsyncIterable<any>;
      return this.wrapGoogleStream(streamResult, modelName, startTime, options);
    } catch (error) {
      console.error('GoogleProvider generateContent (stream) failed:', error);
      throw error;
    }
  }

  private async *wrapGoogleStream(
    stream: AsyncIterable<any>,
    modelName: string,
    startTime: number,
    options: ProviderWrapperOptions,
  ): AsyncGenerator<any> {
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of stream) {
      // Google includes usageMetadata in every chunk; take the latest values
      if (chunk.usageMetadata) {
        inputTokens = chunk.usageMetadata.promptTokenCount ?? 0;
        outputTokens = chunk.usageMetadata.candidatesTokenCount ?? 0;
      }
      yield chunk;
    }

    if (!options.skipLogging) {
      const { cost } = calculateCost('google', modelName, inputTokens, outputTokens);
      logToBackend(this.endpoint, this.trackerApiKey, {
        provider: 'google',
        model: modelName,
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

export default GoogleProvider;
