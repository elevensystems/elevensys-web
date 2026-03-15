'use client';

import { CalendarDays, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { ActionButton } from '@/components/action-button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
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
import type { JiraProject } from '@/types/timesheet';

const MONTH_ABBRS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Parse "D/Mon/YY" or "DD/Mon/YY" → Date (local time) */
function parseApiDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2})$/);
  if (!match) return null;
  const [, day, monthAbbr, yearShort] = match;
  const monthIndex = MONTH_ABBRS.findIndex(
    m => m.toLowerCase() === monthAbbr.toLowerCase()
  );
  if (monthIndex === -1) return null;
  return new Date(
    2000 + parseInt(yearShort, 10),
    monthIndex,
    parseInt(day, 10)
  );
}

/** Weekend matcher for react-day-picker disabled prop */
const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

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
  selectedDates: Date[];
  onSelectedDatesChange: (dates: Date[]) => void;
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
  selectedDates,
  onSelectedDatesChange,
  parsedDates,
  onRemoveDate,
  onClearAllDates,
}: MissingWorklogsCardProps) {
  const handleSearchClick = async () => {
    const result = await onSearchWarnings();
    if (result) {
      const dates = result.dates
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(parseApiDate)
        .filter((d): d is Date => d !== null && !isWeekend(d));
      onSelectedDatesChange(dates);
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
          </CardTitle>
          <CardDescription>
            Search for dates with missing worklogs in a project, then select
            dates on the calendar below
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Step 1 — Search Controls */}
        <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
          <span className='flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
            1
          </span>
          Select project &amp; date range
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 items-end'>
          <div className='space-y-2'>
            <Label htmlFor='project-select'>
              Project <span className='text-destructive'>*</span>
            </Label>
              <NativeSelect
                id='project-select'
                value={selectedProjectId}
                onChange={e => onProjectChange(e.target.value)}
                disabled={isLoadingProjects}
              >
                <option value=''>
                  {isLoadingProjects
                    ? 'Loading projects...'
                    : 'Select a project'}
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
              <ActionButton
                onClick={handleSearchClick}
                disabled={
                  !selectedProjectId || !warningFromDate || !warningToDate
                }
                className='w-full sm:w-auto'
                leftIcon={<Search />}
                isLoading={isSearchingWarnings}
                loadingText='Searching...'
              >
                Find Dates
              </ActionButton>
            </div>
          </div>
        </div>

        {/* Step 2 — Calendar Date Picker */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
              <span className='flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
                2
              </span>
              Select dates
              {parsedDates.length > 0 && (
                <Badge
                  variant='secondary'
                  className='ml-1 bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300 border-green-200 dark:border-green-800'
                >
                  {parsedDates.length} date
                  {parsedDates.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <div className='rounded-lg border bg-card p-2 w-full'>
            <Calendar
              mode='multiple'
              selected={selectedDates}
              onSelect={dates => onSelectedDatesChange(dates ?? [])}
              disabled={isWeekend}
              numberOfMonths={6}
              showOutsideDays={false}
              className='w-full'
              classNames={{ root: 'w-full' }}
            />
          </div>

          <p className='text-xs text-muted-foreground'>
            Click days to select or deselect. Weekends are disabled. Use
            &quot;Find Dates&quot; above to auto-select missing worklog dates.
          </p>

          {/* Date Chips */}
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
              <ActionButton
                variant='ghost'
                onClick={onClearAllDates}
                className='h-7 text-xs text-destructive hover:bg-destructive hover:text-white'
                leftIcon={<Trash2 />}
              >
                Clear all
              </ActionButton>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
