/**
 * AI service configuration shared across API routes
 */

/** Default AI model to use when none specified */
export const DEFAULT_MODEL = 'gpt-5-nano';

/** Allowlist of valid AI models */
export const MODEL_ALLOWLIST = new Set(['gpt-5', 'gpt-5-mini', 'gpt-5-nano']);

/** Request timeout in ms for AI service calls */
export const REQUEST_TIMEOUT_MS = 30000;

/**
 * Validates and returns the model to use, falling back to default if invalid
 */
export const getValidModel = (model?: string): string => {
  return MODEL_ALLOWLIST.has(model ?? '') ? (model as string) : DEFAULT_MODEL;
};
