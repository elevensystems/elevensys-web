'use client';

import Link from 'next/link';

import { AlertCircle, ClipboardList, Loader2, Search } from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import { getWorklogKey, useWorklogs } from '@/hooks/use-worklogs';

import { BulkDeleteAction } from './_components/bulk-delete-action';
import { WorklogRow } from './_components/worklog-row';

export default function MyWorklogsPage() {
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();

  const {
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    worklogs,
    isLoading,
    deletingId,
    error,
    hasSearched,
    totalHours,
    selectedIds,
    allSelected,
    someSelected,
    isBulkDeleting,
    bulkDeleteProgress,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
    handleSearch,
    handleDelete,
    handleBulkDelete,
  } = useWorklogs({ settings, isConfigured, isLoaded });

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
                  <BulkDeleteAction
                    selectedCount={selectedIds.size}
                    isBulkDeleting={isBulkDeleting}
                    bulkDeleteProgress={bulkDeleteProgress}
                    onBulkDelete={handleBulkDelete}
                    onClearSelection={clearSelection}
                  />
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
                      {worklogs.map(worklog => {
                        const key = getWorklogKey(worklog);
                        return (
                          <WorklogRow
                            key={key}
                            worklog={worklog}
                            isSelected={selectedIds.has(key)}
                            isDeleting={deletingId === key}
                            onToggleSelect={toggleSelect}
                            onDelete={handleDelete}
                          />
                        );
                      })}
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
