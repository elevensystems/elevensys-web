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

export const JIRA_BASE_URLS = [
  { label: 'jiradc', value: 'https://insight.fsoft.com.vn/jiradc' },
  { label: 'jira3', value: 'https://insight.fsoft.com.vn/jira3' },
  { label: 'jira9', value: 'https://insight.fsoft.com.vn/jira9' },
] as const;

export const STANDARD_HOURS = 8;
export const MIN_HOURS = 0.25;
export const MAX_HOURS = 24;
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

export function isValidIssueKey(key: string): boolean {
  return /^[A-Z][A-Z0-9]+-\d+$/.test(key.trim());
}

/**
 * Format an ISO date string to a human-readable date
 * e.g. "2025-01-15" → "Jan 15, 2025"
 */
export function formatDisplayDate(dateStr: string): string {
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
