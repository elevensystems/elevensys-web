'use client';

import { CalendarDays, Loader2, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import type { JiraProject } from '@/types/timesheet';

interface MissingWorklogsCardProps {
  projects: JiraProject[];
  selectedProjectId: string;
  onProjectChange: (id: string) => void;
  isLoadingProjects: boolean;
  warningFromDate: string;
  warningToDate: string;
  onWarningFromDateChange: (date: string) => void;
  onWarningToDateChange: (date: string) => void;
  isSearchingWarnings: boolean;
  onSearchWarnings: () => Promise<{ dates: string; count: number } | null>;
  datesText: string;
  onDatesTextChange: (text: string) => void;
  parsedDates: string[];
  onRemoveDate: (date: string) => void;
  onClearAllDates: () => void;
}

export function MissingWorklogsCard({
  projects,
  selectedProjectId,
  onProjectChange,
  isLoadingProjects,
  warningFromDate,
  warningToDate,
  onWarningFromDateChange,
  onWarningToDateChange,
  isSearchingWarnings,
  onSearchWarnings,
  datesText,
  onDatesTextChange,
  parsedDates,
  onRemoveDate,
  onClearAllDates,
}: MissingWorklogsCardProps) {
  const handleSearchClick = async () => {
    const result = await onSearchWarnings();
    if (result) {
      onDatesTextChange(result.dates);
      toast.success(`Found missing dates for ${result.count} user(s)`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col gap-1'>
          <CardTitle className='flex items-center gap-2'>
            <CalendarDays className='h-5 w-5 text-primary' />
            Find Missing Worklogs
            {parsedDates.length > 0 && (
              <Badge
                variant='secondary'
                className='ml-1 bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300 border-green-200 dark:border-green-800'
              >
                {parsedDates.length} date
                {parsedDates.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Search for dates with missing worklogs in a project and auto-fill
            the dates below
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Step 1 — Search Controls */}
        <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
          <span className='flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
            1
          </span>
          Select project & date range
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 items-end'>
          <div className='space-y-2'>
            <Label htmlFor='project-select'>Project</Label>
            <NativeSelect
              id='project-select'
              value={selectedProjectId}
              onChange={e => onProjectChange(e.target.value)}
              disabled={isLoadingProjects}
            >
              <option value=''>
                {isLoadingProjects ? 'Loading projects...' : 'Select a project'}
              </option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.key} — {project.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className='space-y-2 sm:col-span-2'>
            <Label>Date Range</Label>
            <div className='flex flex-col sm:flex-row items-end gap-3'>
              <DateRangePicker
                id='warning-date-range'
                from={warningFromDate}
                to={warningToDate}
                onRangeChange={(from, to) => {
                  onWarningFromDateChange(from);
                  onWarningToDateChange(to);
                }}
                className='flex-1 w-full'
              />
              <Button
                onClick={handleSearchClick}
                disabled={
                  isSearchingWarnings ||
                  !selectedProjectId ||
                  !warningFromDate ||
                  !warningToDate
                }
                className='w-full sm:w-auto'
              >
                {isSearchingWarnings ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Search className='h-4 w-4' />
                )}
                {isSearchingWarnings ? 'Searching...' : 'Find Dates'}
              </Button>
            </div>
          </div>
        </div>

        {/* Step 2 — Dates Editor */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
              <span className='flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
                2
              </span>
              Review & edit dates
            </div>
          </div>

          <Textarea
            id='specific-dates'
            value={datesText}
            onChange={e => onDatesTextChange(e.target.value)}
            placeholder='E.g., 20/Aug/25, 21/Aug/25, 22/Aug/25, 25/Aug/25'
            rows={2}
            className='font-mono text-sm'
          />

          {/* Date Badges */}
          {parsedDates.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {parsedDates.map(date => (
                <Badge
                  key={date}
                  variant='secondary'
                  className='gap-1 pr-1 font-mono text-xs'
                >
                  {date}
                  <button
                    type='button'
                    onClick={() => onRemoveDate(date)}
                    className='ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors'
                    aria-label={`Remove ${date}`}
                  >
                    <X className='h-3 w-3' />
                  </button>
                </Badge>
              ))}
              <Button
                variant='ghost'
                onClick={onClearAllDates}
                className='h-7 text-xs text-muted-foreground hover:text-destructive'
              >
                <Trash2 className='h-3 w-3' />
                Clear all
              </Button>
            </div>
          )}

          <p className='text-xs text-muted-foreground'>
            Comma-separated dates in DD/Mon/YY format. Each work entry will be
            logged for every date listed above.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
