'use client';

import { useState } from 'react';

import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { RequestStatus, RequestStatusState } from '@/types/timesheet';

const STATUS_DOT_COLORS: Record<RequestStatusState, string> = {
  pending: 'bg-muted-foreground/30',
  'in-progress': 'bg-blue-500 animate-pulse',
  success: 'bg-green-500',
  failed: 'bg-red-500',
  skipped: 'bg-muted-foreground/20',
};

function StatusIcon({ status }: { status: RequestStatusState }) {
  switch (status) {
    case 'pending':
      return <Clock className='h-3.5 w-3.5 text-muted-foreground' />;
    case 'in-progress':
      return (
        <Loader2 className='h-3.5 w-3.5 animate-spin text-blue-500' />
      );
    case 'success':
      return (
        <CheckCircle2 className='h-3.5 w-3.5 text-green-600 dark:text-green-400 animate-in fade-in-0 zoom-in-75 duration-150' />
      );
    case 'failed':
      return (
        <XCircle className='h-3.5 w-3.5 text-red-600 dark:text-red-400 animate-in fade-in-0 zoom-in-75 duration-150' />
      );
    case 'skipped':
      return <Clock className='h-3.5 w-3.5 text-muted-foreground/50' />;
  }
}

function EntryOverallIcon({
  dateStatuses,
}: {
  dateStatuses: RequestStatus[];
}) {
  const allDone = dateStatuses.every(
    (s) =>
      s.status === 'success' ||
      s.status === 'failed' ||
      s.status === 'skipped'
  );
  const hasInProgress = dateStatuses.some(
    (s) => s.status === 'in-progress'
  );
  const allSuccess = dateStatuses.every((s) => s.status === 'success');
  const hasFailed = dateStatuses.some((s) => s.status === 'failed');

  if (hasInProgress) {
    return <Loader2 className='h-4 w-4 animate-spin text-blue-500' />;
  }
  if (allDone && allSuccess) {
    return (
      <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
    );
  }
  if (allDone && hasFailed) {
    return (
      <XCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
    );
  }
  return <Clock className='h-4 w-4 text-muted-foreground' />;
}

interface EntryStatusRowProps {
  issueKey: string;
  dateStatuses: RequestStatus[];
  isActive: boolean;
}

export function EntryStatusRow({
  issueKey,
  dateStatuses,
  isActive,
}: EntryStatusRowProps) {
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const [prevIsActive, setPrevIsActive] = useState(isActive);
  const hasFailed = dateStatuses.some((s) => s.status === 'failed');
  const allDone = dateStatuses.every(
    (s) =>
      s.status === 'success' ||
      s.status === 'failed' ||
      s.status === 'skipped'
  );

  const completedCount = dateStatuses.filter(
    (s) => s.status === 'success' || s.status === 'failed' || s.status === 'skipped'
  ).length;

  // Track isActive transitions via setState-during-render pattern (allowed by React)
  if (isActive !== prevIsActive) {
    setPrevIsActive(isActive);
    if (isActive && !prevIsActive) {
      setManualExpanded(null);
    }
    if (!isActive && prevIsActive && allDone && !hasFailed) {
      setManualExpanded(null);
    }
  }

  // Derive expanded: manual override takes precedence, otherwise auto-expand when active (and not all-done-success)
  const autoExpanded = isActive && !(allDone && !hasFailed);
  const expanded = manualExpanded ?? autoExpanded;

  return (
    <div className='border-b last:border-b-0'>
      <button
        type='button'
        onClick={() => setManualExpanded(!expanded)}
        className='flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 transition-colors'
      >
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
            expanded && 'rotate-90'
          )}
        />
        <EntryOverallIcon dateStatuses={dateStatuses} />
        <span className='font-mono font-medium'>{issueKey}</span>
        <div className='flex items-center gap-0.5 ml-2'>
          {dateStatuses.map((ds, i) => (
            <span
              key={`${ds.date}-${i}`}
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full transition-colors duration-300',
                STATUS_DOT_COLORS[ds.status]
              )}
            />
          ))}
        </div>
        <span className='ml-auto text-xs text-muted-foreground tabular-nums'>
          ({completedCount}/{dateStatuses.length})
        </span>
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-[500px]' : 'max-h-0'
        )}
      >
        <div className='border-t bg-muted/30 px-3 py-1.5'>
          {dateStatuses.map((ds, i) => (
            <div
              key={`${ds.date}-${i}`}
              className='flex items-center gap-2.5 py-1 pl-7 text-xs'
            >
              <StatusIcon status={ds.status} />
              <span className='font-mono text-muted-foreground'>
                {ds.date}
              </span>
              {ds.status === 'failed' && ds.error && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className='ml-1 cursor-help text-red-600 dark:text-red-400 underline decoration-dotted'>
                      error
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side='top'
                    className='max-w-[300px] text-xs'
                  >
                    {ds.error.length > 200
                      ? `${ds.error.slice(0, 200)}...`
                      : ds.error}
                  </TooltipContent>
                </Tooltip>
              )}
              {ds.status === 'skipped' && (
                <span className='text-muted-foreground/60'>skipped</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
