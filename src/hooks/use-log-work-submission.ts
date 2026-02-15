'use client';

import { useCallback, useState } from 'react';

import {
  REQUEST_DELAY_MS,
  delay,
  formatDateForApi,
  getCurrentTime,
  parseSpecificDates,
} from '@/lib/timesheet';
import type {
  LogWorkResult,
  TimesheetSettings,
  WorkEntry,
} from '@/types/timesheet';

interface SubmitParams {
  entries: WorkEntry[];
  dateMode: 'range' | 'specific';
  datesText: string;
  startDate: string;
  endDate: string;
}

interface RetryParams {
  failedResults: LogWorkResult[];
  dateMode: 'range' | 'specific';
  startDate: string;
  endDate: string;
}

export function useLogWorkSubmission(settings: TimesheetSettings) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [results, setResults] = useState<LogWorkResult[]>([]);

  const submitSingleEntry = useCallback(
    async (
      entry: WorkEntry,
      dates: string[],
      isPeriod: boolean,
      headers: Record<string, string>,
      time: string
    ): Promise<LogWorkResult> => {
      if (isPeriod) {
        // Range mode: single request
        try {
          const response = await fetch('/api/timesheet/logwork', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              jiraInstance: settings.jiraInstance,
              worklog: {
                username: settings.username,
                issueKey: entry.issueKey.trim(),
                timeSpend: entry.hours * 3600,
                startDate: dates[0],
                endDate: dates[1],
                typeOfWork: entry.typeOfWork,
                description: entry.description,
                time,
                remainingTime: 0,
                period: true,
              },
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `HTTP ${response.status}`);
          }

          return { entry, success: true };
        } catch (err) {
          return {
            entry,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          };
        }
      }

      // Specific dates mode: one request per date
      const failedDates: string[] = [];
      const entryErrors: string[] = [];
      let successCount = 0;

      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        try {
          const response = await fetch('/api/timesheet/logwork', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              jiraInstance: settings.jiraInstance,
              worklog: {
                username: settings.username,
                issueKey: entry.issueKey.trim(),
                timeSpend: entry.hours * 3600,
                startDate: date,
                endDate: date,
                typeOfWork: entry.typeOfWork,
                description: entry.description,
                time,
                remainingTime: 0,
                period: false,
              },
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `HTTP ${response.status}`);
          }

          successCount++;
        } catch (err) {
          failedDates.push(date);
          entryErrors.push(
            `${date}: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }

        if (i < dates.length - 1) {
          await delay(REQUEST_DELAY_MS);
        }
      }

      if (entryErrors.length === 0) {
        return { entry, success: true };
      } else if (successCount > 0) {
        return {
          entry,
          success: false,
          error: `${successCount}/${dates.length} dates succeeded. Failures: ${entryErrors.join('; ')}`,
          failedDates,
        };
      } else {
        return {
          entry,
          success: false,
          error: entryErrors.join('; '),
          failedDates,
        };
      }
    },
    [settings.jiraInstance, settings.username]
  );

  const submitEntries = useCallback(
    async ({
      entries,
      dateMode,
      datesText,
      startDate,
      endDate,
    }: SubmitParams): Promise<LogWorkResult[]> => {
      setIsSubmitting(true);
      setProgress(0);
      setResults([]);

      const validEntries = entries.filter(e => e.issueKey.trim());
      const logResults: LogWorkResult[] = [];
      const time = getCurrentTime();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.token}`,
      };

      const total = validEntries.length;

      for (let i = 0; i < validEntries.length; i++) {
        const entry = validEntries[i];
        setProgressText(
          `Logging ${entry.issueKey} (${i + 1}/${total})...`
        );
        setProgress(Math.round(((i + 1) / total) * 100));

        let dates: string[];
        let isPeriod: boolean;

        if (dateMode === 'range') {
          dates = [formatDateForApi(startDate), formatDateForApi(endDate)];
          isPeriod = true;
        } else {
          dates = parseSpecificDates(datesText);
          isPeriod = false;
        }

        const result = await submitSingleEntry(
          entry,
          dates,
          isPeriod,
          headers,
          time
        );
        logResults.push(result);

        if (i < validEntries.length - 1) {
          await delay(REQUEST_DELAY_MS);
        }
      }

      setProgress(100);
      setResults(logResults);
      setIsSubmitting(false);

      return logResults;
    },
    [settings.token, submitSingleEntry]
  );

  const retryFailed = useCallback(
    async ({
      failedResults,
      dateMode,
      startDate,
      endDate,
    }: RetryParams): Promise<LogWorkResult[]> => {
      setIsSubmitting(true);
      setProgress(0);
      setResults([]);

      const logResults: LogWorkResult[] = [];
      const time = getCurrentTime();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.token}`,
      };

      const total = failedResults.length;

      for (let i = 0; i < failedResults.length; i++) {
        const { entry, failedDates } = failedResults[i];
        setProgressText(
          `Retrying ${entry.issueKey} (${i + 1}/${total})...`
        );
        setProgress(Math.round(((i + 1) / total) * 100));

        let dates: string[];
        let isPeriod: boolean;

        if (dateMode === 'range') {
          dates = [formatDateForApi(startDate), formatDateForApi(endDate)];
          isPeriod = true;
        } else {
          // Only retry the dates that previously failed
          dates = failedDates && failedDates.length > 0
            ? failedDates
            : [];
          isPeriod = false;
        }

        if (dates.length === 0) {
          logResults.push({
            entry,
            success: false,
            error: 'No dates to retry',
          });
          continue;
        }

        const result = await submitSingleEntry(
          entry,
          dates,
          isPeriod,
          headers,
          time
        );
        logResults.push(result);

        if (i < failedResults.length - 1) {
          await delay(REQUEST_DELAY_MS);
        }
      }

      setProgress(100);
      setResults(logResults);
      setIsSubmitting(false);

      return logResults;
    },
    [settings.token, submitSingleEntry]
  );

  const resetResults = useCallback(() => {
    setResults([]);
    setProgress(0);
    setProgressText('');
  }, []);

  return {
    isSubmitting,
    progress,
    progressText,
    results,
    submitEntries,
    retryFailed,
    resetResults,
  };
}
