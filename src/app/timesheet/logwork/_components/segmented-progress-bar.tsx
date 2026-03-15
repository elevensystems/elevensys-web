'use client';

import { useMemo } from 'react';

import { cn } from '@/lib/utils';
import type { RequestStatus, RequestStatusState } from '@/types/timesheet';

const SEGMENT_CAP = 30;

const STATUS_COLORS: Record<RequestStatusState, string> = {
  pending: 'bg-muted',
  'in-progress': 'bg-blue-500 animate-pulse',
  success: 'bg-green-500',
  failed: 'bg-red-500',
  skipped: 'bg-muted/50',
};

function SegmentedBar({
  statuses,
}: {
  statuses: RequestStatus[];
}) {
  return (
    <div className='flex h-2.5 w-full gap-px overflow-hidden rounded-full'>
      {statuses.map((rs, i) => (
        <div
          key={`${rs.entryId}-${rs.date}-${i}`}
          className={cn(
            'h-full flex-1 transition-colors duration-300 ease-out',
            'first:rounded-l-full last:rounded-r-full',
            STATUS_COLORS[rs.status]
          )}
        />
      ))}
    </div>
  );
}

function SmoothBar({
  statuses,
}: {
  statuses: RequestStatus[];
}) {
  const completed = statuses.filter(
    (s) => s.status === 'success' || s.status === 'failed' || s.status === 'skipped'
  ).length;
  const total = statuses.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasFailed = statuses.some((s) => s.status === 'failed');

  return (
    <div className='h-2.5 w-full overflow-hidden rounded-full bg-muted'>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500 ease-out',
          hasFailed
            ? 'bg-gradient-to-r from-green-500 to-amber-500'
            : 'bg-green-500'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface SegmentedProgressBarProps {
  statuses: RequestStatus[];
  className?: string;
}

export function SegmentedProgressBar({
  statuses,
  className,
}: SegmentedProgressBarProps) {
  const completed = useMemo(
    () =>
      statuses.filter(
        (s) =>
          s.status === 'success' ||
          s.status === 'failed' ||
          s.status === 'skipped'
      ).length,
    [statuses]
  );

  const useSegmented = statuses.length <= SEGMENT_CAP;

  return (
    <div className={cn('space-y-1.5', className)}>
      {useSegmented ? (
        <SegmentedBar statuses={statuses} />
      ) : (
        <SmoothBar statuses={statuses} />
      )}
      <div className='flex items-center justify-between text-xs text-muted-foreground'>
        <span>
          {completed}/{statuses.length} requests
        </span>
        <div className='flex items-center gap-3'>
          <span className='flex items-center gap-1'>
            <span className='inline-block h-2 w-2 rounded-full bg-green-500' />
            {statuses.filter((s) => s.status === 'success').length}
          </span>
          {statuses.some((s) => s.status === 'failed') && (
            <span className='flex items-center gap-1'>
              <span className='inline-block h-2 w-2 rounded-full bg-red-500' />
              {statuses.filter((s) => s.status === 'failed').length}
            </span>
          )}
          {statuses.some((s) => s.status === 'skipped') && (
            <span className='flex items-center gap-1'>
              <span className='inline-block h-2 w-2 rounded-full bg-muted' />
              {statuses.filter((s) => s.status === 'skipped').length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
