const MONTH_ABBRS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const STANDARD_HOURS = 8;
export const MIN_HOURS = 0.25;
export const MAX_HOURS = 8;
export const HOUR_STEP = 0.25;
export const REQUEST_DELAY_MS = 1500;
export const SETTINGS_STORAGE_KEY = 'timesheet_settings';

/**
 * Convert YYYY-MM-DD to Jira API format D/Mon/YY
 * e.g. "2025-01-15" → "15/Jan/25"
 */
export function formatDateForApi(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const month = MONTH_ABBRS[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

/**
 * Get current time string in API format " HH:mm:ss"
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return ` ${hours}:${minutes}:${seconds}`;
}

export function generateEntryId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Jira ticket format regex: uppercase alphanumerics + dash + number
 * Examples: C99CMSMKPCM1-01, C99KBBATC2025-37
 */
export const JIRA_TICKET_REGEX = /^[A-Z0-9]+-\d+$/;

/**
 * Validate Jira issue key format
 * @param key - The issue key to validate (e.g., "C99CMSMKPCM1-01")
 * @returns true if valid, false otherwise
 */
export function isValidIssueKey(key: string): boolean {
  const trimmed = key.trim().toUpperCase();
  return JIRA_TICKET_REGEX.test(trimmed);
}

/**
 * Format a date string to a human-readable date
 * Supports: "2025-01-15" (ISO) or "06/Feb/26" (Jira DD/Mon/YY)
 * → "Jan 15, 2025" or "Feb 6, 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  // Handle Jira format: "DD/Mon/YY"
  const tempoMatch = dateStr.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2})$/);
  if (tempoMatch) {
    const [, day, monthAbbr, yearShort] = tempoMatch;
    const monthIndex = MONTH_ABBRS.findIndex(
      m => m.toLowerCase() === monthAbbr.toLowerCase()
    );
    if (monthIndex !== -1) {
      const fullYear = 2000 + parseInt(yearShort, 10);
      const date = new Date(fullYear, monthIndex, parseInt(day, 10));
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  }

  // Fallback: ISO format "YYYY-MM-DD"
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Delay execution for a given number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
