'use client';

import { useState } from 'react';

import {
  CheckCheckIcon,
  ChevronDown,
  ChevronRight,
  LayoutList,
} from 'lucide-react';

import { ActionButton } from '@/components/action-button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatHours, getWorkTypeBadgeClass } from '@/lib/timesheet';
import { cn } from '@/lib/utils';
import type { JiraProject, WorkEntry } from '@/types/timesheet';

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

function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const COLLAPSE_THRESHOLD = 3;

interface LogWorkConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  entries: WorkEntry[];
  parsedDates: string[];
  selectedProject?: JiraProject;
  totalHours: number;
}

export function LogWorkConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  entries,
  parsedDates,
  selectedProject,
  totalHours,
}: LogWorkConfirmDialogProps) {
  const validEntries = entries.filter(e => e.issueKey.trim());
  const totalWorklogs = validEntries.length * parsedDates.length;
  const totalHoursAll = totalHours * parsedDates.length;

  const shouldCollapse = parsedDates.length > COLLAPSE_THRESHOLD;
  const [expandedDates, setExpandedDates] = useState<Set<string>>(
    () => new Set(shouldCollapse ? [] : parsedDates)
  );
  const [allExpanded, setAllExpanded] = useState(!shouldCollapse);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedDates(new Set());
      setAllExpanded(false);
    } else {
      setExpandedDates(new Set(parsedDates));
      setAllExpanded(true);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='flex flex-col gap-0 p-0 sm:max-w-lg'
        hideCloseButton
      >
        {/* Fixed header */}
        <SheetHeader className='px-6 pt-6 pb-4 border-b shrink-0'>
          <SheetTitle>Confirm Submission</SheetTitle>
          <SheetDescription>
            Review the worklogs that will be created before confirming.
          </SheetDescription>

          {/* Summary Banner */}
          <div className='flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3 mt-2'>
            <LayoutList className='h-4 w-4 shrink-0 text-primary' />
            <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm'>
              <span>
                <span className='font-semibold'>{totalWorklogs}</span>{' '}
                <span className='text-muted-foreground'>worklogs</span>
              </span>
              <span>
                <span className='font-semibold'>{parsedDates.length}</span>{' '}
                <span className='text-muted-foreground'>
                  {parsedDates.length !== 1 ? 'dates' : 'date'}
                </span>
              </span>
              <span>
                <span className='font-semibold'>
                  {formatHours(totalHoursAll)}h
                </span>{' '}
                <span className='text-muted-foreground'>total</span>
              </span>
              {selectedProject && (
                <span className='text-muted-foreground'>
                  · {selectedProject.key}
                </span>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable date list */}
        <div className='flex items-center justify-between px-6 py-3 shrink-0'>
          <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
            Grouped by date
          </p>
          {shouldCollapse && (
            <button
              type='button'
              onClick={toggleAll}
              className='text-xs text-primary hover:underline'
            >
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          )}
        </div>

        <ScrollArea className='flex-1 min-h-0'>
          <div className='space-y-2 px-6 pb-4'>
            {parsedDates.map(date => {
              const dateObj = parseApiDate(date);
              const label = dateObj ? formatLongDate(dateObj) : date;
              const isExpanded = expandedDates.has(date);

              return (
                <div key={date} className='rounded-md border overflow-hidden'>
                  <button
                    type='button'
                    onClick={() => toggleDate(date)}
                    className='flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/50 transition-colors'
                  >
                    <span>{label}</span>
                    <div className='flex items-center gap-2 text-muted-foreground'>
                      <span className='text-xs tabular-nums'>
                        {formatHours(totalHours)}h
                      </span>
                      {isExpanded ? (
                        <ChevronDown className='h-3.5 w-3.5' />
                      ) : (
                        <ChevronRight className='h-3.5 w-3.5' />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className='border-t divide-y bg-muted/20'>
                      {validEntries.map(entry => (
                        <div key={entry.id} className='px-3 py-2 space-y-0.5'>
                          <div className='flex items-center justify-between gap-2'>
                            <span className='font-mono text-sm font-medium'>
                              {entry.issueKey}
                            </span>
                            <div className='flex items-center gap-2 shrink-0'>
                              <Badge
                                variant='outline'
                                className={cn(
                                  'text-xs px-1.5 py-0',
                                  getWorkTypeBadgeClass(entry.typeOfWork)
                                )}
                              >
                                {entry.typeOfWork}
                              </Badge>
                              <span className='text-xs tabular-nums text-muted-foreground'>
                                {entry.hours}h
                              </span>
                            </div>
                          </div>
                          {entry.description && (
                            <p className='text-xs text-muted-foreground truncate'>
                              {entry.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Fixed footer */}
        <SheetFooter className='px-6 py-4 border-t shrink-0 flex-row justify-end gap-2'>
          <ActionButton variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </ActionButton>
          <ActionButton onClick={onConfirm} leftIcon={<CheckCheckIcon />}>
            Confirm &amp; Submit
          </ActionButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
