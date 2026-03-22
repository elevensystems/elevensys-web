export interface AutoLogworkTicket {
  issueKey: string;
  hours: number;
  description?: string;
}

export interface AutoLogworkSchedule {
  type: 'weekly' | 'monthly';
  dayOfWeek?: number; // 0=Sun..6=Sat
  dayOfMonth?: number; // 1-31
  hour: number; // 0-23 UTC
}

export interface AutoLogworkConfig {
  configId: string;
  username: string;
  email: string;
  jiraInstance: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  tickets: AutoLogworkTicket[];
  schedule: AutoLogworkSchedule;
  status: 'active' | 'paused_auth';
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'partial' | 'nothing_to_log' | 'failed';
}

export interface CreateAutoLogworkConfigPayload {
  username: string;
  email?: string;
  jiraInstance: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  tickets: AutoLogworkTicket[];
  schedule: AutoLogworkSchedule;
}

export interface UpdateAutoLogworkConfigPayload {
  username: string;
  email?: string;
  jiraInstance?: string;
  projectId?: string;
  projectKey?: string;
  projectName?: string;
  tickets?: AutoLogworkTicket[];
  schedule?: AutoLogworkSchedule;
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00 UTC`,
}));
