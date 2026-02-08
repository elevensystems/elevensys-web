export const WORK_TYPES = [
  'Create',
  'Test',
  'Analysis',
  'Management',
  'Review',
  'Study',
  'Correct',
] as const;

export type WorkType = (typeof WORK_TYPES)[number];

export interface WorkEntry {
  id: string;
  issueKey: string;
  typeOfWork: WorkType;
  description: string;
  hours: number;
}

export interface WorklogPayload {
  username: string;
  issueKey: string;
  timeSpend: number;
  startDate: string;
  endDate: string;
  typeOfWork: string;
  description: string;
  time: string;
  remainingTime: number;
  period: boolean;
}

export interface WorklogEntry {
  id: number;
  issueKey: string;
  issueId: number;
  worked: number;
  remaining: number;
  estimated: number;
  startDate: string;
  startDateEdit: string;
  description: string;
  author: string;
  typeOfWork: string;
  statusWorklog: string;
}

export interface LogWorkRequest {
  token: string;
  worklog: WorklogPayload;
  jiraInstance: string;
}

export interface FetchWorklogsRequest {
  token: string;
  username: string;
  fromDate: string;
  toDate: string;
  jiraInstance: string;
}

export interface TimesheetSettings {
  username: string;
  token: string;
  jiraInstance: string;
}

export interface LogWorkResult {
  entry: WorkEntry;
  success: boolean;
  error?: string;
}
