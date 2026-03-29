/**
 * Parses the `visible-tools` flag value into an allowlist of tool URL paths.
 *
 * Returns `null` when all tools should be shown (empty string or unparseable value).
 * Returns `string[]` when only specific tools should be shown.
 * Returns `[]` when no tools should be shown.
 */
export function getVisibleToolPaths(visibleTools: string): string[] | null {
  if (!visibleTools) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(visibleTools);
  } catch {
    console.error(
      '[flags] visible-tools: malformed JSON value "%s" — showing all tools',
      visibleTools
    );
    return null;
  }

  if (parsed === '') return null;

  if (
    !Array.isArray(parsed) ||
    !parsed.every(item => typeof item === 'string')
  ) {
    console.error(
      '[flags] visible-tools: expected a JSON string array, got %s — showing all tools',
      JSON.stringify(parsed)
    );
    return null;
  }

  return parsed;
}
