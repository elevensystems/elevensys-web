'use client';

import { useState } from 'react';

import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { LogWorkResult } from '@/types/timesheet';

interface SubmissionProgressProps {
  isSubmitting: boolean;
  progress: number;
  progressText: string;
  results: LogWorkResult[];
  onRetryFailed?: () => void;
}

function ProgressBar({
  progress,
  progressText,
}: {
  progress: number;
  progressText: string;
}) {
  return (
    <div className='space-y-2 rounded-lg border bg-card p-4'>
      <div className='flex items-center gap-3'>
        <Loader2 className='h-4 w-4 animate-spin text-primary' />
        <span className='text-sm font-medium'>{progressText}</span>
        <span className='ml-auto text-sm tabular-nums text-muted-foreground'>
          {progress}%
        </span>
      </div>
      <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
        <div
          className='h-full rounded-full bg-primary transition-all duration-500 ease-out'
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function FailedResultItem({ result }: { result: LogWorkResult }) {
  return (
    <div className='rounded-md border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900 dark:bg-red-950/30'>
      <div className='flex items-center gap-2'>
        <XCircle className='h-4 w-4 shrink-0 text-red-500 dark:text-red-400' />
        <span className='font-mono text-sm font-medium text-red-800 dark:text-red-300'>
          {result.entry.issueKey}
        </span>
      </div>
      {result.error && (
        <p className='mt-1 pl-6 text-xs leading-relaxed text-red-600 dark:text-red-400'>
          {result.error}
        </p>
      )}
    </div>
  );
}

function SuccessResultsList({ results }: { results: LogWorkResult[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (results.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type='button'
          className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-green-700 transition-colors hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/20'
        >
          <CheckCircle2 className='h-4 w-4 shrink-0' />
          <span className='font-medium'>
            {results.length} {results.length === 1 ? 'entry' : 'entries'} logged
            successfully
          </span>
          <ChevronDown
            className={`ml-auto h-4 w-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='mt-1 max-h-36 space-y-1 overflow-y-auto pl-6 pr-1'>
          {results.map(result => (
            <div
              key={result.entry.id}
              className='flex items-center gap-2 rounded px-2 py-1 text-xs text-green-700 dark:text-green-400'
            >
              <span className='font-mono'>{result.entry.issueKey}</span>
              <span className='text-green-500 dark:text-green-600'>
                — {result.entry.hours}h
              </span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SubmissionProgress({
  isSubmitting,
  progress,
  progressText,
  results,
  onRetryFailed,
}: SubmissionProgressProps) {
  if (!isSubmitting && results.length === 0) return null;

  const successResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);
  const isDone = results.length > 0 && !isSubmitting;
  const allSucceeded = isDone && failedResults.length === 0;
  const hasFailures = isDone && failedResults.length > 0;

  // Show progress bar only while submitting
  if (isSubmitting) {
    return <ProgressBar progress={progress} progressText={progressText} />;
  }

  return (
    <div className='space-y-3'>
      {/* Summary banner */}
      <div
        className={`rounded-lg border px-4 py-3 ${
          allSucceeded
            ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
            : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'
        }`}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2 text-sm font-medium'>
            {allSucceeded ? (
              <>
                <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
                <span className='text-green-800 dark:text-green-300'>
                  All {successResults.length} entries logged successfully
                </span>
              </>
            ) : (
              <>
                <XCircle className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                <span className='text-amber-800 dark:text-amber-300'>
                  {successResults.length} succeeded, {failedResults.length}{' '}
                  failed
                </span>
              </>
            )}
          </div>

          {hasFailures && onRetryFailed && (
            <Button
              variant='outline'
              size='sm'
              onClick={onRetryFailed}
              className='gap-1.5 border-amber-300 bg-transparent text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/50'
            >
              <RefreshCw className='h-3.5 w-3.5' />
              Retry Failed
            </Button>
          )}
        </div>
      </div>

      {/* Failed entries — shown first, scrollable when many */}
      {failedResults.length > 0 && (
        <div className='max-h-48 space-y-2 overflow-y-auto pr-1'>
          {failedResults.map(result => (
            <FailedResultItem key={result.entry.id} result={result} />
          ))}
        </div>
      )}

      {/* Successful entries — collapsible */}
      <SuccessResultsList results={successResults} />
    </div>
  );
}
