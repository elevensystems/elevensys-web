'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import {
  AlertCircle,
  CalendarDays,
  CalendarRange,
  Clock,
  Loader2,
  Plus,
  Send,
  Settings as SettingsIcon,
  Trash2,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import {
  HOUR_STEP,
  MAX_HOURS,
  MIN_HOURS,
  REQUEST_DELAY_MS,
  STANDARD_HOURS,
  delay,
  formatDateForApi,
  generateEntryId,
  getCurrentTime,
  getTodayISO,
  isValidApiDate,
  isValidIssueKey,
  parseSpecificDates,
} from '@/lib/timesheet';
import {
  type LogWorkResult,
  WORK_TYPES,
  type WorkEntry,
  type WorkType,
} from '@/types/timesheet';

const SAVED_ENTRIES_KEY = 'timesheet_saved_entries';

const createDefaultEntry = (): WorkEntry => ({
  id: generateEntryId(),
  issueKey: '',
  typeOfWork: 'Create',
  description: '',
  hours: 0,
});

function loadSavedEntries(): WorkEntry[] {
  if (typeof window === 'undefined') return [createDefaultEntry()];
  try {
    const saved = localStorage.getItem(SAVED_ENTRIES_KEY);
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

function saveEntriesToStorage(entries: WorkEntry[]): void {
  try {
    const toSave = entries
      .filter(e => e.issueKey.trim())
      .map(({ id: _id, ...rest }) => rest);
    if (toSave.length > 0) {
      localStorage.setItem(SAVED_ENTRIES_KEY, JSON.stringify(toSave));
    }
  } catch {
    // Ignore storage errors
  }
}

export default function LogWorkPage() {
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();

  // Work entries state
  const [entries, setEntries] = useState<WorkEntry[]>([createDefaultEntry()]);
  const [dateMode, setDateMode] = useState<'range' | 'specific'>('specific');
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState(getTodayISO());
  const [datesText, setDatesText] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [results, setResults] = useState<LogWorkResult[]>([]);

  const [error, setError] = useState('');

  // Load saved entries from localStorage on mount
  useEffect(() => {
    const saved = loadSavedEntries();
    if (saved.length > 0 && saved[0].issueKey) {
      setEntries(saved);
    }
  }, []);

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

  const submitDateRange = useCallback(
    async (
      validEntries: WorkEntry[],
      logResults: LogWorkResult[],
      time: string
    ) => {
      const apiStartDate = formatDateForApi(startDate);
      const apiEndDate = formatDateForApi(endDate);
      const total = validEntries.length;

      for (let i = 0; i < validEntries.length; i++) {
        const entry = validEntries[i];
        setProgressText(`Logging ${entry.issueKey} (${i + 1}/${total})...`);
        setProgress(Math.round((i / total) * 100));

        try {
          const response = await fetch('/api/timesheet/logwork', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: settings.token,
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
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || `HTTP ${response.status}`);
          }

          logResults.push({ entry, success: true });
        } catch (err) {
          logResults.push({
            entry,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }

        if (i < validEntries.length - 1) {
          await delay(REQUEST_DELAY_MS);
        }
      }
    },
    [startDate, endDate, settings]
  );

  const submitSpecificDates = useCallback(
    async (
      validEntries: WorkEntry[],
      logResults: LogWorkResult[],
      time: string
    ) => {
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
          setProgress(Math.round((requestIndex / totalRequests) * 100));

          try {
            const response = await fetch('/api/timesheet/logwork', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: settings.token,
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
    },
    [datesText, settings]
  );

  const handleLogWork = useCallback(async () => {
    const validationError = validateEntries();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setError('');
    setIsSubmitting(true);
    setProgress(0);
    setResults([]);

    const validEntries = entries.filter(e => e.issueKey.trim());
    const logResults: LogWorkResult[] = [];
    const time = getCurrentTime();

    if (dateMode === 'range') {
      await submitDateRange(validEntries, logResults, time);
    } else {
      await submitSpecificDates(validEntries, logResults, time);
    }

    setProgress(100);
    setResults(logResults);
    setIsSubmitting(false);

    const successCount = logResults.filter(r => r.success).length;
    const errorCount = logResults.filter(r => !r.success).length;

    // Save entries to localStorage for next session
    saveEntriesToStorage(validEntries);

    if (errorCount === 0) {
      toast.success(`All ${successCount} entries logged successfully!`);
      setProgressText(`All ${successCount} entries logged successfully!`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} succeeded, ${errorCount} failed`);
      setProgressText(
        `${successCount} succeeded, ${errorCount} failed. Check results below.`
      );
    } else {
      toast.error(`All ${errorCount} entries failed`);
      setProgressText(`All ${errorCount} entries failed. Check results below.`);
    }
  }, [
    validateEntries,
    entries,
    dateMode,
    submitDateRange,
    submitSpecificDates,
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
            title='Timesheet Logger'
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
                    {totalHours}h / {STANDARD_HOURS}h
                  </span>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Date Mode Selection */}
              <div className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <Label>Date Selection</Label>
                  <Tabs
                    value={dateMode}
                    onValueChange={v => setDateMode(v as 'range' | 'specific')}
                  >
                    <TabsList>
                      <TabsTrigger value='specific' className='gap-1.5'>
                        <CalendarDays className='h-3.5 w-3.5' />
                        Specific Dates
                      </TabsTrigger>
                      <TabsTrigger value='range' className='gap-1.5'>
                        <CalendarRange className='h-3.5 w-3.5' />
                        Date Range
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {dateMode === 'range' ? (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='start-date'>Start Date</Label>
                      <Input
                        id='start-date'
                        type='date'
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='end-date'>End Date</Label>
                      <Input
                        id='end-date'
                        type='date'
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    <Label htmlFor='specific-dates'>Dates</Label>
                    <Textarea
                      id='specific-dates'
                      value={datesText}
                      onChange={e => setDatesText(e.target.value)}
                      placeholder='E.g., 20/Aug/25, 21/Aug/25, 22/Aug/25, 25/Aug/25'
                      rows={3}
                    />
                    <p className='text-xs text-muted-foreground'>
                      Enter dates separated by commas in DD/Mon/YY format. Each
                      entry will be logged individually for each date.
                    </p>
                  </div>
                )}
              </div>

              {/* Entries Table */}
              <div className='rounded-md border'>
                <Table>
                  <TableHeader className='bg-muted'>
                    <TableRow>
                      <TableHead className='w-[180px] font-semibold'>
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
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            placeholder='C99CMSMKPCM1-01'
                            value={entry.issueKey}
                            onChange={e =>
                              updateEntry(
                                entry.id,
                                'issueKey',
                                e.target.value.toUpperCase()
                              )
                            }
                            className='h-8 font-mono'
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder='Description of work done'
                            value={entry.description}
                            onChange={e =>
                              updateEntry(
                                entry.id,
                                'description',
                                e.target.value
                              )
                            }
                            maxLength={500}
                            className='h-8'
                          />
                        </TableCell>
                        <TableCell>
                          <NativeSelect
                            value={entry.typeOfWork}
                            onChange={e =>
                              updateEntry(
                                entry.id,
                                'typeOfWork',
                                e.target.value as WorkType
                              )
                            }
                          >
                            {WORK_TYPES.map(type => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </NativeSelect>
                        </TableCell>
                        <TableCell>
                          <Input
                            type='number'
                            min={MIN_HOURS}
                            max={MAX_HOURS}
                            step={HOUR_STEP}
                            value={entry.hours || ''}
                            onChange={e =>
                              updateEntry(
                                entry.id,
                                'hours',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className='h-8 w-20'
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-muted-foreground hover:text-destructive'
                            onClick={() => removeEntry(entry.id)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Progress */}
              {(isSubmitting || results.length > 0) && (
                <div className='space-y-3'>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>
                        {progressText}
                      </span>
                      <span className='font-medium'>{progress}%</span>
                    </div>
                    <div className='h-2 w-full rounded-full bg-muted'>
                      <div
                        className='h-full rounded-full bg-primary transition-all duration-300'
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Results */}
                  {results.length > 0 && !isSubmitting && (
                    <div className='space-y-2'>
                      {results.map(result => (
                        <div
                          key={result.entry.id}
                          className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                            result.success
                              ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300'
                              : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300'
                          }`}
                        >
                          <span className='font-mono'>
                            {result.entry.issueKey}
                          </span>
                          <span>
                            {result.success
                              ? 'Logged successfully'
                              : result.error}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className='flex items-center gap-3'>
                <Button
                  onClick={handleLogWork}
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
      </section>
    </MainLayout>
  );
}
