import axios from 'axios';
import { normalizeEndpoint } from './url';

export interface LogData {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs?: number;
  cost: number;
  metadata?: object;
  timestamp: Date;
}

export interface QueuedLog {
  endpoint: string;
  apiKey: string;
  logData: LogData;
  timestamp: number;
  retries: number;
}

const logQueue: QueuedLog[] = [];
const MAX_QUEUE_SIZE = 1000;
const MAX_RETRIES = 3;
let isProcessing = false;
let intervalId: NodeJS.Timeout | null = null;

function sendLog(endpoint: string, apiKey: string, logData: LogData): Promise<void> {
  const baseUrl = normalizeEndpoint(endpoint);
  const url = `${baseUrl}/api/v1/log`;

  return Promise.resolve(
    axios.post(url, logData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    }),
  ).then(() => undefined);
}

export function logToBackend(
  endpoint: string,
  apiKey: string,
  logData: LogData,
  isFromQueue = false,
): void {
  void sendLog(endpoint, apiKey, logData).catch((error) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Spend Tracker] Failed to log:', message);

    if (isFromQueue) {
      return;
    }

    enqueueLog({
      endpoint,
      apiKey,
      logData,
      timestamp: Date.now(),
      retries: 0,
    });
  });
}

function enqueueLog(entry: QueuedLog): void {
  logQueue.push(entry);
  if (logQueue.length > MAX_QUEUE_SIZE) {
    logQueue.splice(0, logQueue.length - MAX_QUEUE_SIZE);
  }

  startQueueProcessor();
}

async function processQueue(): Promise<void> {
  if (isProcessing || logQueue.length === 0) {
    return;
  }

  isProcessing = true;
  const remaining: QueuedLog[] = [];

  for (const entry of logQueue) {
    try {
      await sendLog(entry.endpoint, entry.apiKey, entry.logData);
    } catch {
      const retries = entry.retries + 1;
      if (retries < MAX_RETRIES) {
        remaining.push({ ...entry, retries });
      }
    }
  }

  logQueue.splice(0, logQueue.length, ...remaining);
  isProcessing = false;
}

function startQueueProcessor(): void {
  if (intervalId) {
    return;
  }

  intervalId = setInterval(() => {
    void processQueue();
  }, 60_000);
}

export function getQueueSize(): number {
  return logQueue.length;
}
