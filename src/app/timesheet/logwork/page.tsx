'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { useForm, useStore } from '@tanstack/react-form';
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
  CardDescription,
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
import { logWorkSchema } from '@/lib/schemas/logwork';
import {
  STANDARD_HOURS,
  formatHours,
  generateEntryId,
  getTodayISO,
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

  const [dateMode] = useState<'range' | 'specific'>('specific');
  const [startDate] = useState(getTodayISO());
  const [endDate] = useState(getTodayISO());
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [formOptions] = useState(() => ({
    defaultValues: {
      datesText: '',
      entries: [createDefaultEntry()] as WorkEntry[],
    },
    validators: { onSubmit: logWorkSchema } as const,
    onSubmit: async () => {
      setError('');
      setShowConfirmDialog(true);
    },
  }));

  const form = useForm(formOptions);

  const entries = useStore(form.store, s => s.values.entries);
  const datesText = useStore(form.store, s => s.values.datesText);
  const submitErrors = useStore(form.store, s => s.errorMap?.onSubmit);

  const parsedDates = useMemo(() => parseSpecificDates(datesText), [datesText]);

  const removeDate = useCallback(
    (dateToRemove: string) => {
      const updated = parsedDates.filter(d => d !== dateToRemove).join(', ');
      form.setFieldValue('datesText', updated);
    },
    [parsedDates, form]
  );

  const clearAllDates = useCallback(
    () => form.setFieldValue('datesText', ''),
    [form]
  );

  // Load saved entries from localStorage when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    const saved = loadSavedEntries(selectedProjectId);
    if (saved.length > 0 && saved[0].issueKey) {
      form.setFieldValue('entries', saved);
    } else {
      form.setFieldValue('entries', [createDefaultEntry()]);
    }
    // form instance is stable (created once via useForm) — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const totalHours = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.hours || 0), 0),
    [entries]
  );

  const addEntry = useCallback(() => {
    const current = form.getFieldValue('entries');
    form.setFieldValue('entries', [...current, createDefaultEntry()]);
  }, [form]);

  const removeEntry = useCallback(
    (id: string) => {
      const current = form.getFieldValue('entries');
      if (current.length > 1) {
        form.setFieldValue(
          'entries',
          current.filter(e => e.id !== id)
        );
      }
    },
    [form]
  );

  const updateEntry = useCallback(
    (id: string, field: keyof WorkEntry, value: string | number) => {
      const current = form.getFieldValue('entries');
      form.setFieldValue(
        'entries',
        current.map(entry =>
          entry.id === id ? { ...entry, [field]: value } : entry
        )
      );
    },
    [form]
  );

  // Reactively surface validation errors from TanStack Form
  useEffect(() => {
    if (
      submitErrors &&
      Array.isArray(submitErrors) &&
      submitErrors.length > 0
    ) {
      const message =
        (submitErrors[0] as { message?: string })?.message ??
        'Validation failed';
      setError(message);
      toast.error(message);
    }
  }, [submitErrors]);

  const handleSubmitClick = useCallback(async () => {
    if (!isConfigured) {
      const msg = 'Please configure your Jira settings first.';
      setError(msg);
      toast.error(msg);
      return;
    }
    setError('');
    await form.handleSubmit();
  }, [isConfigured, form]);

  const processResults = useCallback(
    (logResults: LogWorkResult[]) => {
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
        const current = form.getFieldValue('entries');
        form.setFieldValue(
          'entries',
          current.filter(e => failedIssueKeys.has(e.issueKey))
        );
      } else {
        toast.error(`All ${errorCount} entries failed`);
      }
    },
    [form]
  );

  const handleLogWork = useCallback(async () => {
    setShowConfirmDialog(false);

    const currentEntries = form.getFieldValue('entries');
    const currentDatesText = form.getFieldValue('datesText');

    // Save entries to localStorage before submission (preserves for next session)
    const validEntries = currentEntries.filter(e => e.issueKey.trim());
    saveEntriesToStorage(validEntries, selectedProjectId);

    const logResults = await submitEntries({
      entries: currentEntries,
      dateMode,
      datesText: currentDatesText,
      startDate,
      endDate,
    });

    processResults(logResults);
  }, [
    form,
    dateMode,
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
            error={error || undefined}
            infoMessage={
              !error && isConfigured
                ? 'Your Jira settings are configured. You can start logging work entries.'
                : undefined
            }
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
              onDatesTextChange={(text: string) =>
                form.setFieldValue('datesText', text)
              }
              parsedDates={parsedDates}
              onRemoveDate={removeDate}
              onClearAllDates={clearAllDates}
            />
          )}

          {/* Work Entries Card */}
          <Card>
            <CardHeader>
              <div className='flex flex-col gap-1'>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='h-5 w-5' />
                  Work Entries
                </CardTitle>
                <CardDescription>
                  Add work entries with issue key, description, type of work,
                  and hours spent.
                </CardDescription>
              </div>
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
              <div className='overflow-hidden rounded-lg border'>
                <Table>
                  <TableHeader className='bg-muted/50 top-0 z-10'>
                    <TableRow>
                      <TableHead className='w-[230px] font-semibold'>
                        Key
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
