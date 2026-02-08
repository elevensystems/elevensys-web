'use client';

import { useCallback, useMemo, useState } from 'react';

import Link from 'next/link';

import {
  AlertCircle,
  ClipboardList,
  Download,
  Loader2,
  Search,
  SettingsIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
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
  formatDateForApi,
  formatDisplayDate,
  getTodayISO,
} from '@/lib/timesheet';
import type { WorklogEntry } from '@/types/timesheet';

function getStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
}

export default function MyWorklogsPage() {
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();

  const [fromDate, setFromDate] = useState(getMonthStart());
  const [toDate, setToDate] = useState(getTodayISO());
  const [worklogs, setWorklogs] = useState<WorklogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const totalHours = useMemo(
    () => worklogs.reduce((sum, w) => sum + (w.worked || 0), 0),
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: settings.baseUrl,
          token: settings.token,
          username: settings.username,
          fromDate: formatDateForApi(fromDate),
          toDate: formatDateForApi(toDate),
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

  const handleExportCSV = useCallback(() => {
    if (worklogs.length === 0) return;

    const headers = [
      'Issue Key',
      'Date',
      'Hours',
      'Type of Work',
      'Description',
      'Status',
      'Author',
    ];

    const rows = worklogs.map(w => [
      w.issueKey,
      w.startDateEdit || w.startDate,
      String(w.worked),
      w.typeOfWork,
      `"${(w.description || '').replace(/"/g, '""')}"`,
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
                <div className='space-y-2 flex-1 w-full sm:w-auto'>
                  <Label htmlFor='from-date'>From</Label>
                  <DatePicker
                    id='from-date'
                    value={fromDate}
                    onChange={setFromDate}
                  />
                </div>
                <div className='space-y-2 flex-1 w-full sm:w-auto'>
                  <Label htmlFor='to-date'>To</Label>
                  <DatePicker
                    id='to-date'
                    value={toDate}
                    onChange={setToDate}
                  />
                </div>
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
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Issue Key</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className='text-right'>Hours</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {worklogs.map(worklog => (
                        <TableRow key={`${worklog.id}_${worklog.issueId}`}>
                          <TableCell className='font-mono font-medium'>
                            {worklog.issueKey}
                          </TableCell>
                          <TableCell className='text-nowrap'>
                            {worklog.startDateEdit
                              ? formatDisplayDate(worklog.startDateEdit)
                              : worklog.startDate}
                          </TableCell>
                          <TableCell className='text-right font-medium'>
                            {worklog.worked}h
                          </TableCell>
                          <TableCell>{worklog.typeOfWork}</TableCell>
                          <TableCell className='max-w-[200px] truncate'>
                            {worklog.description || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusVariant(worklog.statusWorklog)}
                            >
                              {worklog.statusWorklog}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
