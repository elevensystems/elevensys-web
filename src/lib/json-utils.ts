/**
 * Shared JSON utilities used across tool pages
 */

export interface JsonParseResult {
  value: unknown;
  error: string;
  isValid: boolean;
}

/**
 * Safely parses a JSON string, returning validation info
 */
export const parseJsonSafely = (value: string): JsonParseResult => {
  try {
    return {
      value: JSON.parse(value) as unknown,
      error: '',
      isValid: true,
    };
  } catch (error) {
    return {
      value: null as unknown,
      error: error instanceof Error ? error.message : 'Invalid JSON',
      isValid: false,
    };
  }
};

/**
 * Formats a JSON string with 2-space indentation
 * @throws Error if input is not valid JSON
 */
export const formatJson = async (value: string): Promise<string> => {
  const parsed = JSON.parse(value) as unknown;
  return `${JSON.stringify(parsed, null, 2)}\n`;
};

/**
 * Validates if a string is a valid HTTP/HTTPS URL
 */
export const isValidUrl = (urlString: string): boolean => {
  try {
    const parsedUrl = new URL(urlString.trim());
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};
