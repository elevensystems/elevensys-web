'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import {
  AlertCircle,
  CalendarDays,
  Clock,
  Loader2,
  Plus,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLogWorkSubmission } from '@/hooks/use-log-work-submission';
import { useMissingWorklogs } from '@/hooks/use-missing-worklogs';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import {
  MAX_HOURS,
  MIN_HOURS,
  STANDARD_HOURS,
  formatHours,
  generateEntryId,
  getTodayISO,
  isValidApiDate,
  isValidIssueKey,
  parseSpecificDates,
} from '@/lib/timesheet';
import type { LogWorkResult, WorkEntry } from '@/types/timesheet';

import { LogWorkConfirmDialog } from './_components/confirm-dialog';
import { MissingWorklogsCard } from './_components/missing-worklogs-card';
import { SubmissionProgress } from './_components/submission-progress';
import { WorkEntryRow } from './_components/work-entry-row';

const SAVED_ENTRIES_KEY = 'timesheet_saved_entries';

const createDefaultEntry = (): WorkEntry => ({
  id: generateEntryId(),
  issueKey: '',
  typeOfWork: 'Create',
  description: '',
  hours: 0,
});

function getSavedEntriesKey(projectId?: string): string {
  return projectId
    ? `${SAVED_ENTRIES_KEY}::project::${projectId}`
    : SAVED_ENTRIES_KEY;
}

function loadSavedEntries(projectId?: string): WorkEntry[] {
  if (typeof window === 'undefined') return [createDefaultEntry()];
  try {
    const saved = localStorage.getItem(getSavedEntriesKey(projectId));
    if (saved) {
      const parsed = JSON.parse(saved) as Omit<WorkEntry, 'id'>[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(entry => ({
          ...entry,
          id: generateEntryId(),
        }));
      }
    }
  } catch {
    // Ignore corrupted data
  }
  return [createDefaultEntry()];
}

function saveEntriesToStorage(entries: WorkEntry[], projectId?: string): void {
  try {
    const toSave = entries
      .filter(e => e.issueKey.trim())
      .map(({ id: _id, ...rest }) => rest);
    if (toSave.length > 0) {
      localStorage.setItem(
        getSavedEntriesKey(projectId),
        JSON.stringify(toSave)
      );
    }
  } catch {
    // Ignore storage errors
  }
}

export default function LogWorkPage() {
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();

  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    issues,
    issuesByKey,
    isLoadingProjects,
    isLoadingIssues,
    warningFromDate,
    setWarningFromDate,
    warningToDate,
    setWarningToDate,
    isSearchingWarnings,
    handleSearchWarnings,
  } = useMissingWorklogs({ settings, isConfigured });

  const {
    isSubmitting,
    progress,
    progressText,
    results,
    submitEntries,
    retryFailed,
    resetResults,
  } = useLogWorkSubmission(settings);

  // Work entries state
  const [entries, setEntries] = useState<WorkEntry[]>([createDefaultEntry()]);
  const [dateMode] = useState<'range' | 'specific'>('specific');
  const [startDate] = useState(getTodayISO());
  const [endDate] = useState(getTodayISO());
  const [datesText, setDatesText] = useState('');
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const parsedDates = useMemo(() => parseSpecificDates(datesText), [datesText]);

  const removeDate = useCallback(
    (dateToRemove: string) => {
      const updated = parsedDates.filter(d => d !== dateToRemove).join(', ');
      setDatesText(updated);
    },
    [parsedDates]
  );

  const clearAllDates = useCallback(() => setDatesText(''), []);

  // Load saved entries from localStorage when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    const saved = loadSavedEntries(selectedProjectId);
    if (saved.length > 0 && saved[0].issueKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEntries(saved);
    } else {
      setEntries([createDefaultEntry()]);
    }
  }, [selectedProjectId]);

  const totalHours = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.hours || 0), 0),
    [entries]
  );

  const addEntry = useCallback(() => {
    setEntries(prev => [...prev, createDefaultEntry()]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev =>
      prev.length > 1 ? prev.filter(e => e.id !== id) : prev
    );
  }, []);

  const updateEntry = useCallback(
    (id: string, field: keyof WorkEntry, value: string | number) => {
      setEntries(prev =>
        prev.map(entry =>
          entry.id === id ? { ...entry, [field]: value } : entry
        )
      );
    },
    []
  );

  const validateEntries = useCallback((): string | null => {
    if (!isConfigured) {
      return 'Please configure your Jira settings first.';
    }

    if (dateMode === 'range') {
      if (!startDate || !endDate) {
        return 'Please select a date range.';
      }
      if (new Date(startDate) > new Date(endDate)) {
        return 'Start date must be before or equal to end date.';
      }
    } else {
      const dates = parseSpecificDates(datesText);
      if (dates.length === 0) {
        return 'Please enter at least one date (e.g., 20/Aug/25, 21/Aug/25, 22/Aug/25, 25/Aug/25).';
      }
      for (const date of dates) {
        if (!isValidApiDate(date)) {
          return `Invalid date: "${date}". Expected format: DD/Mon/YY (e.g., 02/Feb/26).`;
        }
      }
    }

    const validEntries = entries.filter(e => e.issueKey.trim());
    if (validEntries.length === 0) {
      return 'Please add at least one work entry with an issue key.';
    }

    for (const entry of validEntries) {
      if (!isValidIssueKey(entry.issueKey)) {
        return `Invalid issue key: "${entry.issueKey}". Expected format: PROJECT-123 (e.g., C99CMSMKPCM1-01)`;
      }
      if (entry.hours < MIN_HOURS || entry.hours > MAX_HOURS) {
        return `Hours for ${entry.issueKey} must be between ${MIN_HOURS} and ${MAX_HOURS}.`;
      }
    }

    return null;
  }, [isConfigured, dateMode, startDate, endDate, datesText, entries]);

  const handleSubmitClick = useCallback(() => {
    const validationError = validateEntries();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }
    setError('');
    setShowConfirmDialog(true);
  }, [validateEntries]);

  const processResults = useCallback((logResults: LogWorkResult[]) => {
    const successCount = logResults.filter(r => r.success).length;
    const errorCount = logResults.filter(r => !r.success).length;

    if (errorCount === 0) {
      toast.success(`All ${successCount} entries logged successfully!`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} succeeded, ${errorCount} failed`);
      // Keep only failed entries in the form so user can edit and resubmit
      const failedIssueKeys = new Set(
        logResults.filter(r => !r.success).map(r => r.entry.issueKey)
      );
      setEntries(prev => prev.filter(e => failedIssueKeys.has(e.issueKey)));
    } else {
      toast.error(`All ${errorCount} entries failed`);
    }
  }, []);

  const handleLogWork = useCallback(async () => {
    setShowConfirmDialog(false);

    // Save entries to localStorage before submission (preserves for next session)
    const validEntries = entries.filter(e => e.issueKey.trim());
    saveEntriesToStorage(validEntries, selectedProjectId);

    const logResults = await submitEntries({
      entries,
      dateMode,
      datesText,
      startDate,
      endDate,
    });

    processResults(logResults);
  }, [
    entries,
    dateMode,
    datesText,
    startDate,
    endDate,
    selectedProjectId,
    submitEntries,
    processResults,
  ]);

  const handleRetryFailed = useCallback(async () => {
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length === 0) return;

    resetResults();

    const logResults = await retryFailed({
      failedResults,
      dateMode,
      startDate,
      endDate,
    });

    processResults(logResults);
  }, [
    results,
    dateMode,
    startDate,
    endDate,
    retryFailed,
    resetResults,
    processResults,
  ]);

  if (!isLoaded) {
    return (
      <MainLayout>
        <section className='container mx-auto px-4 py-12'>
          <div className='flex items-center justify-center h-40'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto space-y-8'>
          <ToolPageHeader
            title='Log Work'
            description='Log your work entries to Jira timesheet. Add work entries and submit them in bulk.'
            error={error}
          />

          {!isConfigured && (
            <Alert className='border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-200'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                <span>
                  Jira settings not configured.{' '}
                  <Link
                    href='/timesheet/config'
                    className='font-medium underline underline-offset-4 hover:text-yellow-900 dark:hover:text-yellow-100'
                  >
                    Go to Configs
                  </Link>{' '}
                  to connect your Jira account.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {isConfigured && (
            <MissingWorklogsCard
              projects={projects}
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
              isLoadingProjects={isLoadingProjects}
              warningFromDate={warningFromDate}
              warningToDate={warningToDate}
              onWarningFromDateChange={setWarningFromDate}
              onWarningToDateChange={setWarningToDate}
              isSearchingWarnings={isSearchingWarnings}
              onSearchWarnings={handleSearchWarnings}
              datesText={datesText}
              onDatesTextChange={setDatesText}
              parsedDates={parsedDates}
              onRemoveDate={removeDate}
              onClearAllDates={clearAllDates}
            />
          )}

          {/* Work Entries Card */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Clock className='h-5 w-5' />
                Work Entries
              </CardTitle>
              <CardAction>
                <div className='flex items-center gap-3 text-sm'>
                  <span className='text-muted-foreground'>Total:</span>
                  <span
                    className={`font-semibold ${
                      totalHours === STANDARD_HOURS
                        ? 'text-green-600 dark:text-green-400'
                        : totalHours > STANDARD_HOURS
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-foreground'
                    }`}
                  >
                    {formatHours(totalHours)}h / {formatHours(STANDARD_HOURS)}h
                  </span>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Entries Table */}
              <div className='rounded-md border'>
                <Table>
                  <TableHeader className='bg-muted'>
                    <TableRow>
                      <TableHead className='w-[230px] font-semibold'>
                        Ticket ID
                      </TableHead>
                      <TableHead className='font-semibold'>
                        Description
                      </TableHead>
                      <TableHead className='w-[150px] font-semibold'>
                        Type of Work
                      </TableHead>
                      <TableHead className='w-[100px] font-semibold'>
                        Hours
                      </TableHead>
                      <TableHead className='w-[50px]' />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map(entry => (
                      <WorkEntryRow
                        key={entry.id}
                        entry={entry}
                        issues={issues}
                        issuesByKey={issuesByKey}
                        isLoadingIssues={isLoadingIssues}
                        onUpdate={updateEntry}
                        onRemove={removeEntry}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              <SubmissionProgress
                isSubmitting={isSubmitting}
                progress={progress}
                progressText={progressText}
                results={results}
                onRetryFailed={handleRetryFailed}
              />

              {/* Action Buttons */}
              <div className='flex items-center gap-3'>
                {results.length > 0 &&
                results.every(r => r.success) &&
                !isSubmitting ? (
                  <Button asChild className='flex-1' size='lg'>
                    <Link href='/timesheet/worklogs'>
                      <CalendarDays className='h-4 w-4' />
                      View My Worklogs
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleSubmitClick}
                      disabled={isSubmitting || !isConfigured}
                      className='flex-1'
                      size='lg'
                    >
                      {isSubmitting ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Send className='h-4 w-4' />
                      )}
                      {isSubmitting ? 'Submitting...' : 'Submit Work Logs'}
                    </Button>
                    <Button
                      variant='outline'
                      size='lg'
                      onClick={addEntry}
                      className='flex-shrink-0 text-primary hover:bg-green-100'
                    >
                      <Plus className='h-4 w-4' />
                      Add Entry
                    </Button>
                  </>
                )}
              </div>

              {!isConfigured && (
                <p className='text-xs text-muted-foreground text-center'>
                  Please{' '}
                  <Link
                    href='/timesheet/config'
                    className='underline underline-offset-4'
                  >
                    configure your Jira settings
                  </Link>{' '}
                  to start logging work.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <LogWorkConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={handleLogWork}
          entries={entries}
          dateMode={dateMode}
          startDate={startDate}
          endDate={endDate}
          parsedDates={parsedDates}
          selectedProject={selectedProject}
          totalHours={totalHours}
        />
      </section>
    </MainLayout>
  );
}
