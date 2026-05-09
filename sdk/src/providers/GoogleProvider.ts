import { GoogleGenerativeAI } from '@google/generative-ai';

import { logToBackend } from '../utils/logger';
import { calculateGoogleCost } from '../utils/pricing';
import type { GoogleUsage, ProviderWrapperOptions } from '../types';

type GenerativeModel = ReturnType<GoogleGenerativeAI['getGenerativeModel']>;
type GenerateContentParams = Parameters<GenerativeModel['generateContent']>[0];
type GenerateContentResult = ReturnType<GenerativeModel['generateContent']>;

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
  ): Promise<GenerateContentResult> {
    const startTime = Date.now();
    try {
      const model = this.genAI.getGenerativeModel({ model: modelName });
      const response = await model.generateContent(params);
      const latencyMs = Date.now() - startTime;

      const usage = (response.response as { usageMetadata?: GoogleUsage })
        .usageMetadata;
      const inputTokens = usage?.promptTokenCount ?? 0;
      const outputTokens = usage?.candidatesTokenCount ?? 0;

      const cost = calculateGoogleCost(modelName, inputTokens, outputTokens);

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
}

export default GoogleProvider;
