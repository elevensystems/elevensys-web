/**
 * Fetch wrapper with timeout support for external API calls
 */

import { REQUEST_TIMEOUT_MS } from './ai-config';

export interface FetchWithTimeoutOptions extends RequestInit {
  /** Timeout in milliseconds (default: REQUEST_TIMEOUT_MS) */
  timeoutMs?: number;
}

export class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Fetches a URL with configurable timeout
 * @throws TimeoutError if request times out
 * @throws Error for other fetch errors
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
