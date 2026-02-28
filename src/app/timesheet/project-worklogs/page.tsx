'use client';

import Link from 'next/link';

import {
  AlertCircle,
  ClipboardList,
  Loader2,
  Search,
} from 'lucide-react';

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
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import { useProjectWorklogs } from '@/hooks/use-project-worklogs';

import { ProjectWorklogRowItem } from './_components/project-worklog-row';

const TYPE_OF_WORK_OPTIONS = [
  'All',
  'Create',
  'Study',
  'Review',
  'Correct',
  'Test',
  'Translate',
];

export default function ProjectWorklogsPage() {
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();

  const {
    projects,
    projectsLoading,
    selectedProject,
    setSelectedProject,
    username,
    setUsername,
    typeOfWork,
    setTypeOfWork,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    rows,
    isLoading,
    error,
    hasSearched,
    currentPage,
    totalPages,
    totalRecords,
    pageStart,
    pageEnd,
    handleSearch,
    goToPage,
  } = useProjectWorklogs({ settings, isConfigured });

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

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto space-y-8'>
          <ToolPageHeader
            title='Project Worklogs'
            description='View logged timesheets for a project. Filter by project, username, type of work, and date range.'
            error={error || undefined}
            infoMessage={
              !error && isConfigured
                ? 'Your Jira settings are configured. Select a project to get started.'
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

          {/* Filters */}
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Search className='h-5 w-5' />
                Search Project Worklogs
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end'>
                <div className='space-y-1.5'>
                  <Label htmlFor='project-select'>
                    Project <span className='text-destructive'>*</span>
                  </Label>
                  <Select
                    value={selectedProject?.id ?? ''}
                    onValueChange={value => {
                      const project = projects.find(p => p.id === value) ?? null;
                      setSelectedProject(project);
                    }}
                    disabled={!isConfigured || projectsLoading}
                  >
                    <SelectTrigger id='project-select' className='w-full'>
                      <SelectValue
                        placeholder={
                          projectsLoading
                            ? 'Loading projects…'
                            : 'Select a project'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} ({project.key})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='username-input'>Username</Label>
                  <Input
                    id='username-input'
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder='All users'
                    disabled={!isConfigured}
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='date-range'>Date Range</Label>
                  <DateRangePicker
                    id='date-range'
                    from={fromDate}
                    to={toDate}
                    onRangeChange={(from, to) => {
                      setFromDate(from);
                      setToDate(to);
                    }}
                    className='w-full'
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='type-of-work-select'>Type of Work</Label>
                  <NativeSelect
                    id='type-of-work-select'
                    value={typeOfWork}
                    onChange={e => setTypeOfWork(e.target.value)}
                    disabled={!isConfigured}
                  >
                    {TYPE_OF_WORK_OPTIONS.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div className='flex items-end'>
                  <Button
                    onClick={handleSearch}
                    disabled={isLoading || !isConfigured || !selectedProject}
                    className='w-full'
                  >
                    {isLoading ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Search className='h-4 w-4' />
                    )}
                    {isLoading ? 'Searching…' : 'Search'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <ClipboardList className='h-5 w-5' />
                Project Worklogs
              </CardTitle>
              {hasSearched && totalRecords > 0 && (
                <CardDescription>
                  {totalRecords} record{totalRecords !== 1 ? 's' : ''} &middot;
                  page {currentPage} of {totalPages} (entries {pageStart}–
                  {pageEnd})
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='overflow-hidden rounded-lg border'>
                  <Table>
                    <TableHeader className='bg-muted/50 top-0 z-10'>
                      <TableRow>
                        <TableHead className='w-[48px]'>No</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className='text-right'>Hours</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          <td className='p-2 pl-4'>
                            <Skeleton className='h-4 w-6' />
                          </td>
                          <td className='p-2'>
                            <Skeleton className='h-4 w-28' />
                          </td>
                          <td className='p-2'>
                            <Skeleton className='h-4 w-40' />
                          </td>
                          <td className='p-2 text-right'>
                            <Skeleton className='h-4 w-10 ml-auto' />
                          </td>
                          <td className='p-2'>
                            <Skeleton className='h-5 w-16 rounded-full' />
                          </td>
                          <td className='p-2'>
                            <Skeleton className='h-4 w-24' />
                          </td>
                          <td className='p-2'>
                            <Skeleton className='h-5 w-16 rounded-full' />
                          </td>
                          <td className='p-2'>
                            <Skeleton className='h-4 w-20' />
                          </td>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : rows.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-40 text-muted-foreground'>
                  {hasSearched ? (
                    <p>No worklogs found for the selected filters.</p>
                  ) : (
                    <p>
                      Select a project and date range, then click
                      &quot;Search&quot; to view project worklogs.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className='overflow-hidden rounded-lg border'>
                    <Table>
                      <TableHeader className='bg-muted/50 top-0 z-10'>
                        <TableRow>
                          <TableHead className='w-[48px]'>No</TableHead>
                          <TableHead>Key</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className='text-right'>Hours</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>User</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map(row => (
                          <ProjectWorklogRowItem key={row.id} row={row} />
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className='flex justify-end mt-4'>
                      <Pagination className='mx-0 w-auto'>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={
                                hasPrevPage && !isLoading
                                  ? () => goToPage(currentPage - 1)
                                  : undefined
                              }
                              aria-disabled={!hasPrevPage || isLoading}
                              className={
                                !hasPrevPage || isLoading
                                  ? 'pointer-events-none opacity-50'
                                  : 'cursor-pointer'
                              }
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }).map((_, i) => {
                            const pageNum = i + 1;
                            const isFirst = i === 0;
                            const isLast = i === totalPages - 1;
                            const isNearCurrent =
                              Math.abs(pageNum - currentPage) <= 1;

                            if (!isFirst && !isLast && !isNearCurrent) {
                              const prevShown =
                                i === 1
                                  ? true
                                  : i - 1 === 0 ||
                                    i - 1 === totalPages - 1 ||
                                    Math.abs(i - currentPage) <= 1;
                              if (prevShown) {
                                return (
                                  <PaginationItem key={i}>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                );
                              }
                              return null;
                            }

                            return (
                              <PaginationItem key={i}>
                                <PaginationLink
                                  isActive={pageNum === currentPage}
                                  onClick={() => goToPage(pageNum)}
                                  className='cursor-pointer'
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          <PaginationItem>
                            <PaginationNext
                              onClick={
                                hasNextPage && !isLoading
                                  ? () => goToPage(currentPage + 1)
                                  : undefined
                              }
                              aria-disabled={!hasNextPage || isLoading}
                              className={
                                !hasNextPage || isLoading
                                  ? 'pointer-events-none opacity-50'
                                  : 'cursor-pointer'
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
