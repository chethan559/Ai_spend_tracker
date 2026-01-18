import axios from 'axios';
import { normalizeEndpoint } from './url';

export interface LogData {
  provider: string;
  model: string;
  tokens: number;
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

/**
 * Send a log entry to the backend API.
 */
function sendLog(endpoint: string, apiKey: string, logData: LogData): Promise<void> {
  const baseUrl = normalizeEndpoint(endpoint);
  const url = `${baseUrl}/api/v1/log`;

  return Promise.resolve(
    axios.post(url, logData, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }),
  ).then(() => undefined);
}

/**
 * Send a log entry to the backend API in a non-blocking, fire-and-forget way.
 * Failed requests are queued and retried in the background.
 */
export function logToBackend(
  endpoint: string,
  apiKey: string,
  logData: LogData,
  isFromQueue = false,
): void {
  // Fire the request without awaiting.
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

/**
 * Add a log entry to the retry queue with FIFO size enforcement.
 */
function enqueueLog(entry: QueuedLog): void {
  logQueue.push(entry);
  if (logQueue.length > MAX_QUEUE_SIZE) {
    logQueue.splice(0, logQueue.length - MAX_QUEUE_SIZE);
  }

  startQueueProcessor();
}

/**
 * Process queued logs in the background, retrying failures up to MAX_RETRIES.
 */
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

/**
 * Start the background queue processor if not already running.
 */
function startQueueProcessor(): void {
  if (intervalId) {
    return;
  }

  intervalId = setInterval(() => {
    void processQueue();
  }, 60_000);
}

/**
 * Return the current queue size (useful for tests).
 */
export function getQueueSize(): number {
  return logQueue.length;
}

