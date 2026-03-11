'use client';

import { Eye, RefreshCw, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { LogWorkResult } from '@/types/timesheet';

interface SubmissionProgressProps {
  isSubmitting: boolean;
  progress: number;
  progressText: string;
  results: LogWorkResult[];
  onRetryFailed?: () => void;
  onViewDetails?: () => void;
}

function ProgressBar({
  progress,
  progressText,
}: {
  progress: number;
  progressText: string;
}) {
  return (
    <div className='space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30'>
      <div className='flex items-center gap-3'>
        <Spinner className='text-blue-600 dark:text-blue-400' />
        <span className='text-sm font-medium text-blue-800 dark:text-blue-300'>
          {progressText}
        </span>
        <span className='ml-auto text-sm tabular-nums text-blue-600 dark:text-blue-400'>
          {progress}%
        </span>
      </div>
      <div className='h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900'>
        <div
          className='h-full rounded-full bg-blue-600 transition-all duration-500 ease-out dark:bg-blue-400'
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function CompactFailureBanner({
  failCount,
  onRetryFailed,
  onViewDetails,
}: {
  failCount: number;
  onRetryFailed?: () => void;
  onViewDetails?: () => void;
}) {
  return (
    <div className='flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-900 dark:bg-amber-950/30'>
      <XCircle className='h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400' />
      <span className='text-sm font-medium text-amber-800 dark:text-amber-300'>
        {failCount} {failCount === 1 ? 'entry' : 'entries'} failed
      </span>
      <div className='ml-auto flex items-center gap-2'>
        {onRetryFailed && (
          <Button
            variant='outline'
            size='sm'
            onClick={onRetryFailed}
            className='h-7 gap-1.5 border-amber-300 bg-transparent text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/50'
          >
            <RefreshCw className='h-3 w-3' />
            Retry
          </Button>
        )}
        {onViewDetails && (
          <Button
            variant='outline'
            size='sm'
            onClick={onViewDetails}
            className='h-7 gap-1.5 border-amber-300 bg-transparent text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/50'
          >
            <Eye className='h-3 w-3' />
            Details
          </Button>
        )}
      </div>
    </div>
  );
}

export function SubmissionProgress({
  isSubmitting,
  progress,
  progressText,
  results,
  onRetryFailed,
  onViewDetails,
}: SubmissionProgressProps) {
  if (!isSubmitting && results.length === 0) return null;

  if (isSubmitting) {
    return <ProgressBar progress={progress} progressText={progressText} />;
  }

  const failedResults = results.filter(r => !r.success);
  if (failedResults.length > 0) {
    return (
      <CompactFailureBanner
        failCount={failedResults.length}
        onRetryFailed={onRetryFailed}
        onViewDetails={onViewDetails}
      />
    );
  }

  return null;
}
