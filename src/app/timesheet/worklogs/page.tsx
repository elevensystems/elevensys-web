'use client';

import { useCallback, useMemo, useState } from 'react';

import Link from 'next/link';

import {
  AlertCircle,
  ClipboardList,
  Download,
  Loader2,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import {
  REQUEST_DELAY_MS,
  delay,
  formatDateForApi,
  formatDisplayDate,
  getStatusVariant,
  getWorkTypeBadgeClass,
} from '@/lib/timesheet';
import type { WorklogEntry } from '@/types/timesheet';

function getMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
}

function getMonthEnd(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];
}

export default function MyWorklogsPage() {
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();

  const [fromDate, setFromDate] = useState(getMonthStart());
  const [toDate, setToDate] = useState(getMonthEnd());
  const [worklogs, setWorklogs] = useState<WorklogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);

  const allSelected =
    worklogs.length > 0 && selectedIds.size === worklogs.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < worklogs.length;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(worklogs.map(w => `${w.id}_${w.issueId}`)));
    }
  }, [allSelected, worklogs]);

  const toggleSelect = useCallback((key: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const totalHours = useMemo(
    () => worklogs.reduce((sum, w) => sum + (Number(w.worked) || 0), 0),
    [worklogs]
  );

  const handleSearch = useCallback(async () => {
    if (!isConfigured) {
      setError('Please configure your Jira settings on the Log Work page.');
      return;
    }

    if (!fromDate || !toDate) {
      setError('Please select a date range.');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setError('Start date must be before or equal to end date.');
      return;
    }

    setError('');
    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch('/api/timesheet/worklogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.token}`,
        },
        body: JSON.stringify({
          username: settings.username,
          fromDate: formatDateForApi(fromDate),
          toDate: formatDateForApi(toDate),
          jiraInstance: settings.jiraInstance,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Failed to fetch worklogs: HTTP ${response.status}`
        );
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // Deduplicate by id + issueId
        const seen = new Set<string>();
        const unique = result.data.filter((entry: WorklogEntry) => {
          const key = `${entry.id}_${entry.issueId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Sort by date descending
        unique.sort((a: WorklogEntry, b: WorklogEntry) => {
          const dateA = a.startDateEdit || a.startDate;
          const dateB = b.startDateEdit || b.startDate;
          return dateB.localeCompare(dateA);
        });

        setWorklogs(unique);
        setSelectedIds(new Set());
        toast.success(`Found ${unique.length} worklog entries`);
      } else {
        setWorklogs([]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch worklogs';
      setError('Failed to fetch worklogs');
      toast.error('Failed to fetch worklogs');
      setWorklogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, fromDate, toDate, settings]);

  const handleDelete = useCallback(
    async (worklogId: number, issueId: number) => {
      if (!isConfigured) {
        toast.error('Jira settings not configured.');
        return;
      }

      const worklog = worklogs.find(
        w => w.id === worklogId && w.issueId === issueId
      );
      if (worklog?.statusWorklog?.toLowerCase() === 'approved') {
        toast.error('Cannot delete an approved worklog.');
        return;
      }

      const key = `${worklogId}_${issueId}`;
      setDeletingId(key);

      try {
        const response = await fetch('/api/timesheet/worklogs/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.token}`,
          },
          body: JSON.stringify({
            issueId,
            timesheetId: worklogId,
            jiraInstance: settings.jiraInstance,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `Failed to delete worklog: HTTP ${response.status}`
          );
        }

        setWorklogs(prev =>
          prev.filter(w => !(w.id === worklogId && w.issueId === issueId))
        );
        toast.success('Worklog deleted successfully');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete worklog';
        toast.error(message);
      } finally {
        setDeletingId(null);
      }
    },
    [isConfigured, settings, worklogs]
  );

  const handleBulkDelete = useCallback(async () => {
    if (!isConfigured || selectedIds.size === 0) return;

    setIsBulkDeleting(true);
    setBulkDeleteProgress(0);

    const allSelected = worklogs.filter(w =>
      selectedIds.has(`${w.id}_${w.issueId}`)
    );
    const approvedCount = allSelected.filter(
      w => w.statusWorklog?.toLowerCase() === 'approved'
    ).length;
    const selected = allSelected.filter(
      w => w.statusWorklog?.toLowerCase() !== 'approved'
    );

    if (approvedCount > 0) {
      toast.warning(
        `${approvedCount} approved worklog${approvedCount !== 1 ? 's' : ''} skipped — approved worklogs cannot be deleted.`
      );
    }

    if (selected.length === 0) {
      setIsBulkDeleting(false);
      return;
    }

    const total = selected.length;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selected.length; i++) {
      const worklog = selected[i];
      const key = `${worklog.id}_${worklog.issueId}`;
      setDeletingId(key);
      setBulkDeleteProgress(Math.round(((i + 1) / total) * 100));

      try {
        const response = await fetch('/api/timesheet/worklogs/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.token}`,
          },
          body: JSON.stringify({
            issueId: worklog.issueId,
            timesheetId: worklog.id,
            jiraInstance: settings.jiraInstance,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `Failed to delete worklog: HTTP ${response.status}`
          );
        }

        setWorklogs(prev =>
          prev.filter(
            w => !(w.id === worklog.id && w.issueId === worklog.issueId)
          )
        );
        successCount++;
      } catch {
        failCount++;
      }

      if (i < selected.length - 1) {
        await delay(REQUEST_DELAY_MS);
      }
    }

    setDeletingId(null);
    setSelectedIds(new Set());
    setIsBulkDeleting(false);
    setBulkDeleteProgress(0);

    if (failCount === 0) {
      toast.success(`Deleted ${successCount} worklog(s) successfully`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${failCount} failed`);
    } else {
      toast.error(`Failed to delete ${failCount} worklog(s)`);
    }
  }, [isConfigured, selectedIds, worklogs, settings]);

  const handleExportCSV = useCallback(() => {
    if (worklogs.length === 0) return;

    const headers = [
      'Ticket ID',
      'Description',
      'Hours',
      'Type of Work',
      'Date',
      'Status',
      'Author',
    ];

    const rows = worklogs.map(w => [
      w.issueKey,
      `"${(w.description || '').replace(/"/g, '""')}"`,
      String(w.worked),
      w.typeOfWork,
      w.startDateEdit || w.startDate,
      w.statusWorklog,
      w.author,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `worklogs_${fromDate}_${toDate}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  }, [worklogs, fromDate, toDate]);

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
            title='My Worklogs'
            description='View your logged timesheets from Jira. Search by date range to see all your work entries.'
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

          {/* Filters */}
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Search className='h-5 w-5' />
                Search Worklogs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col sm:flex-row items-end gap-4'>
                <DateRangePicker
                  id='date-range'
                  from={fromDate}
                  to={toDate}
                  onRangeChange={(from, to) => {
                    setFromDate(from);
                    setToDate(to);
                  }}
                  className='flex-1 w-full sm:w-auto'
                />
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !isConfigured}
                  className='w-full sm:w-auto'
                >
                  {isLoading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Search className='h-4 w-4' />
                  )}
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <ClipboardList className='h-5 w-5' />
                Worklogs
              </CardTitle>
              {worklogs.length > 0 && (
                <>
                  <CardDescription>
                    {worklogs.length} entries &middot; {totalHours.toFixed(1)}{' '}
                    total hours
                  </CardDescription>
                  <CardAction>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleExportCSV}
                    >
                      <Download className='h-4 w-4' />
                      Export CSV
                    </Button>
                  </CardAction>
                </>
              )}
            </CardHeader>
            <CardContent>
              {worklogs.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-40 text-muted-foreground'>
                  {hasSearched ? (
                    <p>No worklogs found for the selected date range.</p>
                  ) : (
                    <p>
                      Select a date range and click &quot;Search&quot; to view
                      your worklogs.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Bulk Action Bar */}
                  {selectedIds.size > 0 && (
                    <div className='mb-4 flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3'>
                      <span className='text-sm font-medium'>
                        {selectedIds.size} worklog
                        {selectedIds.size !== 1 ? 's' : ''} selected
                      </span>
                      <div className='flex items-center gap-2'>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant='destructive'
                              size='sm'
                              disabled={isBulkDeleting}
                            >
                              {isBulkDeleting ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                <Trash2 className='h-4 w-4' />
                              )}
                              {isBulkDeleting
                                ? `Deleting... ${bulkDeleteProgress}%`
                                : `Delete ${selectedIds.size}`}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete {selectedIds.size} Worklog
                                {selectedIds.size !== 1 ? 's' : ''}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete{' '}
                                <span className='font-semibold'>
                                  {selectedIds.size}
                                </span>{' '}
                                selected worklog
                                {selectedIds.size !== 1 ? 's' : ''}? This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant='destructive'
                                onClick={handleBulkDelete}
                              >
                                Delete {selectedIds.size} Worklog
                                {selectedIds.size !== 1 ? 's' : ''}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setSelectedIds(new Set())}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader className='bg-muted/50'>
                        <TableRow>
                          <TableHead className='w-[40px]'>
                            <Checkbox
                              checked={
                                allSelected
                                  ? true
                                  : someSelected
                                    ? 'indeterminate'
                                    : false
                              }
                              onCheckedChange={toggleSelectAll}
                              aria-label='Select all'
                            />
                          </TableHead>
                          <TableHead>Ticket ID</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className='text-right'>Hours</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className='w-[60px]' />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {worklogs.map(worklog => (
                          <TableRow
                            key={`${worklog.id}_${worklog.issueId}`}
                            data-state={
                              selectedIds.has(
                                `${worklog.id}_${worklog.issueId}`
                              )
                                ? 'selected'
                                : undefined
                            }
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(
                                  `${worklog.id}_${worklog.issueId}`
                                )}
                                onCheckedChange={() =>
                                  toggleSelect(
                                    `${worklog.id}_${worklog.issueId}`
                                  )
                                }
                                disabled={
                                  worklog.statusWorklog?.toLowerCase() ===
                                  'approved'
                                }
                                aria-label={`Select ${worklog.issueKey}`}
                              />
                            </TableCell>
                            <TableCell className='font-mono font-medium'>
                              {worklog.issueKey}
                            </TableCell>
                            <TableCell className='max-w-[200px] truncate'>
                              {worklog.description || '-'}
                            </TableCell>
                            <TableCell className='text-right font-medium'>
                              {parseFloat(String(worklog.worked))}h
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant='outline'
                                className={getWorkTypeBadgeClass(
                                  worklog.typeOfWork
                                )}
                              >
                                {worklog.typeOfWork}
                              </Badge>
                            </TableCell>
                            <TableCell className='text-nowrap'>
                              {worklog.startDateEdit
                                ? formatDisplayDate(worklog.startDateEdit)
                                : worklog.startDate}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusVariant(
                                  worklog.statusWorklog
                                )}
                              >
                                {worklog.statusWorklog}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-8 w-8 text-muted-foreground hover:text-destructive'
                                    disabled={
                                      worklog.statusWorklog?.toLowerCase() ===
                                        'approved' ||
                                      deletingId ===
                                        `${worklog.id}_${worklog.issueId}`
                                    }
                                    title={
                                      worklog.statusWorklog?.toLowerCase() ===
                                      'approved'
                                        ? 'Cannot delete an approved worklog'
                                        : 'Delete worklog'
                                    }
                                  >
                                    {deletingId ===
                                    `${worklog.id}_${worklog.issueId}` ? (
                                      <Loader2 className='h-4 w-4 animate-spin' />
                                    ) : (
                                      <Trash2 className='h-4 w-4' />
                                    )}
                                    <span className='sr-only'>Delete</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Worklog
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this
                                      worklog for{' '}
                                      <span className='font-semibold'>
                                        {worklog.issueKey}
                                      </span>{' '}
                                      ({parseFloat(String(worklog.worked))}h on{' '}
                                      {worklog.startDateEdit
                                        ? formatDisplayDate(
                                            worklog.startDateEdit
                                          )
                                        : worklog.startDate}
                                      )? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      variant='destructive'
                                      onClick={() =>
                                        handleDelete(
                                          worklog.id,
                                          worklog.issueId
                                        )
                                      }
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
