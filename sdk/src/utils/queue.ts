import axios from 'axios';

import { normalizeEndpoint } from './url';
import type { LogData } from './logger';

export interface LogQueueEntry {
  endpoint: string;
  apiKey: string;
  logData: LogData;
}

/**
 * In-memory retry queue for log entries.
 */
export class LogQueue {
  private queue: LogQueueEntry[] = [];
  private maxSize: number;
  private retryInterval: number;
  private isProcessing = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Create a queue with optional size and retry interval overrides.
   */
  constructor(maxSize = 1000, retryInterval = 60_000) {
    this.maxSize = maxSize;
    this.retryInterval = retryInterval;
  }

  /**
   * Add a log entry to the queue and enforce max size (FIFO).
   */
  add(logEntry: LogQueueEntry): void {
    this.queue.push(logEntry);
    if (this.queue.length > this.maxSize) {
      this.queue.splice(0, this.queue.length - this.maxSize);
    }
  }

  /**
   * Attempt to send all queued logs, keeping failures for retry.
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const remaining: LogQueueEntry[] = [];

    for (const entry of this.queue) {
      const baseUrl = normalizeEndpoint(entry.endpoint);
      const url = `${baseUrl}/api/v1/log`;

      try {
        await axios.post(url, entry.logData, {
          headers: {
            Authorization: `Bearer ${entry.apiKey}`,
          },
        });
      } catch {
        remaining.push(entry);
      }
    }

    this.queue = remaining;
    this.isProcessing = false;
  }

  /**
   * Start background processing of the queue on an interval.
   */
  startProcessing(): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      void this.processQueue();
    }, this.retryInterval);
  }

  /**
   * Stop background processing of the queue.
   */
  stopProcessing(): void {
    if (!this.intervalId) {
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  /**
   * Get the current queue size.
   */
  getQueueSize(): number {
    return this.queue.length;
  }
}

/**
 * Singleton queue instance for logging retries.
 */
export const logQueue = new LogQueue();

