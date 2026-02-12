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

export function useLogWorkSubmission(settings: TimesheetSettings) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [results, setResults] = useState<LogWorkResult[]>([]);

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

      if (dateMode === 'range') {
        const apiStartDate = formatDateForApi(startDate);
        const apiEndDate = formatDateForApi(endDate);
        const total = validEntries.length;

        for (let i = 0; i < validEntries.length; i++) {
          const entry = validEntries[i];
          setProgressText(
            `Logging ${entry.issueKey} (${i + 1}/${total})...`
          );
          setProgress(Math.round((i / total) * 100));

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
                  startDate: apiStartDate,
                  endDate: apiEndDate,
                  typeOfWork: entry.typeOfWork,
                  description: entry.description,
                  time,
                  remainingTime: 0,
                  period: true,
                },
              }),
            });

            if (!response.ok) {
              const errorData = await response
                .json()
                .catch(() => null);
              throw new Error(
                errorData?.error || `HTTP ${response.status}`
              );
            }

            logResults.push({ entry, success: true });
          } catch (err) {
            logResults.push({
              entry,
              success: false,
              error:
                err instanceof Error ? err.message : 'Unknown error',
            });
          }

          if (i < validEntries.length - 1) {
            await delay(REQUEST_DELAY_MS);
          }
        }
      } else {
        const dates = parseSpecificDates(datesText);
        const totalRequests = validEntries.length * dates.length;
        let requestIndex = 0;

        for (const entry of validEntries) {
          const entryErrors: string[] = [];
          let entrySuccessCount = 0;

          for (const date of dates) {
            requestIndex++;
            setProgressText(
              `Logging ${entry.issueKey} for ${date} (${requestIndex}/${totalRequests})...`
            );
            setProgress(
              Math.round((requestIndex / totalRequests) * 100)
            );

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
                const errorData = await response
                  .json()
                  .catch(() => null);
                throw new Error(
                  errorData?.error || `HTTP ${response.status}`
                );
              }

              entrySuccessCount++;
            } catch (err) {
              entryErrors.push(
                `${date}: ${err instanceof Error ? err.message : 'Unknown error'}`
              );
            }

            if (requestIndex < totalRequests) {
              await delay(REQUEST_DELAY_MS);
            }
          }

          if (entryErrors.length === 0) {
            logResults.push({ entry, success: true });
          } else if (entrySuccessCount > 0) {
            logResults.push({
              entry,
              success: false,
              error: `${entrySuccessCount}/${dates.length} dates succeeded. Failures: ${entryErrors.join('; ')}`,
            });
          } else {
            logResults.push({
              entry,
              success: false,
              error: entryErrors.join('; '),
            });
          }
        }
      }

      setProgress(100);
      setResults(logResults);
      setIsSubmitting(false);

      return logResults;
    },
    [settings.token, settings.jiraInstance, settings.username]
  );

  return {
    isSubmitting,
    progress,
    progressText,
    results,
    submitEntries,
  };
}
