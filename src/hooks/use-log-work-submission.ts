'use client';

import { useCallback, useRef, useState } from 'react';

import {
  REQUEST_DELAY_MS,
  delay,
  formatDateForApi,
  getCurrentTime,
  parseSpecificDates,
} from '@/lib/timesheet';
import type {
  LogWorkResult,
  RequestStatus,
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
  const [isCancelled, setIsCancelled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [results, setResults] = useState<LogWorkResult[]>([]);
  const [requestStatuses, setRequestStatuses] = useState<RequestStatus[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const abortRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updateRequestStatus = useCallback(
    (
      entryId: string,
      date: string,
      status: RequestStatus['status'],
      error?: string
    ) => {
      setRequestStatuses((prev) =>
        prev.map((rs) =>
          rs.entryId === entryId && rs.date === date
            ? { ...rs, status, error }
            : rs
        )
      );
    },
    []
  );

  const cancelSubmission = useCallback(() => {
    abortRef.current = true;
    setIsCancelled(true);
  }, []);

  const submitSingleDate = useCallback(
    async (
      entry: WorkEntry,
      date: string,
      endDate: string,
      isPeriod: boolean,
      headers: Record<string, string>,
      time: string
    ): Promise<{ success: boolean; error?: string }> => {
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
              endDate: isPeriod ? endDate : date,
              typeOfWork: entry.typeOfWork,
              description: entry.description,
              time,
              remainingTime: 0,
              period: isPeriod,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `HTTP ${response.status}`);
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
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
      const validEntries = entries.filter((e) => e.issueKey.trim());
      const time = getCurrentTime();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.token}`,
      };

      let dates: string[];
      let isPeriod: boolean;

      if (dateMode === 'range') {
        dates = [formatDateForApi(startDate)];
        isPeriod = true;
      } else {
        dates = parseSpecificDates(datesText);
        isPeriod = false;
      }

      const formattedEndDate =
        dateMode === 'range' ? formatDateForApi(endDate) : '';

      // Pre-build all request statuses
      const initialStatuses: RequestStatus[] = validEntries.flatMap((entry) =>
        (isPeriod ? [dates[0]] : dates).map((date) => ({
          entryId: entry.id,
          issueKey: entry.issueKey.trim(),
          date,
          status: 'pending' as const,
        }))
      );

      setRequestStatuses(initialStatuses);
      setIsSubmitting(true);
      setIsCancelled(false);
      setProgress(0);
      setResults([]);
      abortRef.current = false;
      startTimer();

      const totalRequests = initialStatuses.length;
      let completedRequests = 0;
      const logResults: LogWorkResult[] = [];

      for (const entry of validEntries) {
        const entryDates = isPeriod ? [dates[0]] : dates;
        const failedDates: string[] = [];
        const entryErrors: string[] = [];
        let successCount = 0;

        for (let i = 0; i < entryDates.length; i++) {
          const date = entryDates[i];

          if (abortRef.current) {
            // Mark remaining as skipped
            updateRequestStatus(entry.id, date, 'skipped');
            for (let j = i + 1; j < entryDates.length; j++) {
              updateRequestStatus(entry.id, entryDates[j], 'skipped');
            }
            // Also mark remaining entries
            const entryIdx = validEntries.indexOf(entry);
            for (let k = entryIdx + 1; k < validEntries.length; k++) {
              for (const d of entryDates) {
                updateRequestStatus(validEntries[k].id, d, 'skipped');
              }
            }
            // Build result for current entry
            if (successCount > 0 || failedDates.length > 0) {
              logResults.push({
                entry,
                success: failedDates.length === 0 && successCount > 0,
                error:
                  failedDates.length > 0
                    ? entryErrors.join('; ')
                    : undefined,
                failedDates:
                  failedDates.length > 0 ? failedDates : undefined,
              });
            }
            // Build skipped results for remaining entries
            for (let k = entryIdx + 1; k < validEntries.length; k++) {
              logResults.push({
                entry: validEntries[k],
                success: false,
                error: 'Cancelled',
              });
            }
            break;
          }

          updateRequestStatus(entry.id, date, 'in-progress');

          const result = await submitSingleDate(
            entry,
            date,
            formattedEndDate,
            isPeriod,
            headers,
            time
          );

          completedRequests++;
          setProgress(Math.round((completedRequests / totalRequests) * 100));

          if (result.success) {
            updateRequestStatus(entry.id, date, 'success');
            successCount++;
          } else {
            updateRequestStatus(entry.id, date, 'failed', result.error);
            failedDates.push(date);
            entryErrors.push(
              `${date}: ${result.error || 'Unknown error'}`
            );
          }

          if (i < entryDates.length - 1) {
            await delay(REQUEST_DELAY_MS);
          }
        }

        if (abortRef.current) break;

        // Build entry-level result
        if (entryErrors.length === 0) {
          logResults.push({ entry, success: true });
        } else if (successCount > 0) {
          logResults.push({
            entry,
            success: false,
            error: `${successCount}/${entryDates.length} dates succeeded. Failures: ${entryErrors.join('; ')}`,
            failedDates,
          });
        } else {
          logResults.push({
            entry,
            success: false,
            error: entryErrors.join('; '),
            failedDates,
          });
        }

        if (
          !abortRef.current &&
          validEntries.indexOf(entry) < validEntries.length - 1
        ) {
          await delay(REQUEST_DELAY_MS);
        }
      }

      setProgress(100);
      setResults(logResults);
      setIsSubmitting(false);
      stopTimer();

      return logResults;
    },
    [
      settings.token,
      submitSingleDate,
      updateRequestStatus,
      startTimer,
      stopTimer,
    ]
  );

  const retryFailed = useCallback(
    async ({
      failedResults,
      dateMode,
      startDate,
      endDate,
    }: RetryParams): Promise<LogWorkResult[]> => {
      const time = getCurrentTime();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.token}`,
      };

      const isPeriod = dateMode === 'range';
      const formattedEndDate =
        dateMode === 'range' ? formatDateForApi(endDate) : '';

      // Reset failed statuses to pending
      setRequestStatuses((prev) =>
        prev.map((rs) =>
          rs.status === 'failed' ? { ...rs, status: 'pending', error: undefined } : rs
        )
      );

      setIsSubmitting(true);
      setIsCancelled(false);
      setProgress(0);
      abortRef.current = false;
      startTimer();

      const logResults: LogWorkResult[] = [];
      const total = failedResults.length;

      for (let i = 0; i < failedResults.length; i++) {
        const { entry, failedDates } = failedResults[i];

        setProgressText(`Retrying ${entry.issueKey} (${i + 1}/${total})...`);
        setProgress(Math.round(((i + 1) / total) * 100));

        let dates: string[];

        if (isPeriod) {
          dates = [formatDateForApi(startDate)];
        } else {
          dates = failedDates && failedDates.length > 0 ? failedDates : [];
        }

        if (dates.length === 0) {
          logResults.push({
            entry,
            success: false,
            error: 'No dates to retry',
          });
          continue;
        }

        const entryFailedDates: string[] = [];
        const entryErrors: string[] = [];
        let successCount = 0;

        for (let j = 0; j < dates.length; j++) {
          const date = dates[j];

          if (abortRef.current) {
            updateRequestStatus(entry.id, date, 'skipped');
            for (let k = j + 1; k < dates.length; k++) {
              updateRequestStatus(entry.id, dates[k], 'skipped');
            }
            break;
          }

          updateRequestStatus(entry.id, date, 'in-progress');

          const result = await submitSingleDate(
            entry,
            date,
            formattedEndDate,
            isPeriod,
            headers,
            time
          );

          if (result.success) {
            updateRequestStatus(entry.id, date, 'success');
            successCount++;
          } else {
            updateRequestStatus(entry.id, date, 'failed', result.error);
            entryFailedDates.push(date);
            entryErrors.push(
              `${date}: ${result.error || 'Unknown error'}`
            );
          }

          if (j < dates.length - 1) {
            await delay(REQUEST_DELAY_MS);
          }
        }

        if (entryErrors.length === 0) {
          logResults.push({ entry, success: true });
        } else if (successCount > 0) {
          logResults.push({
            entry,
            success: false,
            error: `${successCount}/${dates.length} succeeded. Failures: ${entryErrors.join('; ')}`,
            failedDates: entryFailedDates,
          });
        } else {
          logResults.push({
            entry,
            success: false,
            error: entryErrors.join('; '),
            failedDates: entryFailedDates,
          });
        }

        if (abortRef.current) break;

        if (i < failedResults.length - 1) {
          await delay(REQUEST_DELAY_MS);
        }
      }

      setProgress(100);
      setResults(logResults);
      setIsSubmitting(false);
      stopTimer();

      return logResults;
    },
    [
      settings.token,
      submitSingleDate,
      updateRequestStatus,
      startTimer,
      stopTimer,
    ]
  );

  const resetResults = useCallback(() => {
    setResults([]);
    setRequestStatuses([]);
    setProgress(0);
    setProgressText('');
    setElapsedSeconds(0);
    setIsCancelled(false);
  }, []);

  return {
    isSubmitting,
    isCancelled,
    progress,
    progressText,
    results,
    requestStatuses,
    elapsedSeconds,
    submitEntries,
    retryFailed,
    cancelSubmission,
    resetResults,
  };
}
