'use client';

import { useEffect, useState } from 'react';

import { CheckCircle2, ChevronDown, RefreshCw, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Spinner } from '@/components/ui/spinner';
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
    <div className='animate-in fade-in duration-300 space-y-3 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-sm dark:border-blue-900/50 dark:from-blue-950/40 dark:to-blue-900/20'>
      <div className='flex items-center gap-3'>
        <Spinner className='text-blue-600 dark:text-blue-400' />
        <div className='flex-1'>
          <p className='text-sm font-semibold text-blue-900 dark:text-blue-100'>
            {progressText}
          </p>
          <p className='text-xs text-blue-700 dark:text-blue-300'>
            Processing entries...
          </p>
        </div>
        <span className='text-sm font-mono font-semibold tabular-nums text-blue-800 dark:text-blue-200'>
          {progress}%
        </span>
      </div>
      <div className='h-2.5 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900/50'>
        <div
          className='h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg transition-all duration-500 ease-out dark:from-blue-500 dark:to-blue-400'
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function FailedResultItem({ result }: { result: LogWorkResult }) {
  return (
    <div className='animate-in fade-in slide-in-from-top-2 duration-300 rounded-lg border border-red-200 bg-red-50/60 p-3 dark:border-red-900/50 dark:bg-red-950/30'>
      <div className='flex items-start gap-3'>
        <XCircle className='mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400' />
        <div className='flex-1'>
          <p className='font-mono text-sm font-semibold text-red-900 dark:text-red-200'>
            {result.entry.issueKey}
          </p>
          {result.error && (
            <p className='mt-1 text-xs leading-relaxed text-red-700 dark:text-red-300'>
              {result.error}
            </p>
          )}
        </div>
      </div>
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
          className='animate-in fade-in duration-300 flex w-full items-center gap-3 rounded-lg bg-green-50/60 px-4 py-3 text-left transition-colors hover:bg-green-100/50 dark:bg-green-950/30 dark:hover:bg-green-900/40'
        >
          <CheckCircle2 className='h-5 w-5 shrink-0 text-green-600 dark:text-green-400' />
          <div className='flex-1'>
            <p className='font-semibold text-green-900 dark:text-green-100'>
              {results.length} {results.length === 1 ? 'entry' : 'entries'} logged
              successfully
            </p>
            <p className='text-xs text-green-700 dark:text-green-300'>
              Click to view details
            </p>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='animate-in fade-in duration-200 space-y-2 border-t border-green-200 px-4 pt-3 dark:border-green-900/50'>
          {results.map(result => (
            <div
              key={result.entry.id}
              className='flex items-center justify-between rounded-md bg-green-100/30 px-3 py-2 text-sm dark:bg-green-900/20'
            >
              <span className='font-mono font-medium text-green-800 dark:text-green-200'>
                {result.entry.issueKey}
              </span>
              <span className='text-green-700 dark:text-green-300'>
                {result.entry.hours}h
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
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!isSubmitting && results.length > 0) {
      const timer = setTimeout(() => setShowResult(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isSubmitting, results]);

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

  if (!showResult) return null;

  return (
    <div className='animate-in fade-in duration-300 space-y-4'>
      {/* Summary banner */}
      <div
        className={`rounded-xl border px-4 py-4 shadow-sm ${
          allSucceeded
            ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 dark:border-green-900/50 dark:from-green-950/40 dark:to-green-900/20'
            : 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:border-amber-900/50 dark:from-amber-950/40 dark:to-amber-900/20'
        }`}
      >
        <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            {allSucceeded ? (
              <>
                <div className='rounded-full bg-green-200 p-2 dark:bg-green-900/50'>
                  <CheckCircle2 className='h-6 w-6 text-green-600 dark:text-green-400' />
                </div>
                <div>
                  <p className='font-semibold text-green-900 dark:text-green-100'>
                    Perfect! All entries logged
                  </p>
                  <p className='text-sm text-green-700 dark:text-green-300'>
                    {successResults.length} work entries submitted successfully
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className='rounded-full bg-amber-200 p-2 dark:bg-amber-900/50'>
                  <XCircle className='h-6 w-6 text-amber-600 dark:text-amber-400' />
                </div>
                <div>
                  <p className='font-semibold text-amber-900 dark:text-amber-100'>
                    Partial submission
                  </p>
                  <p className='text-sm text-amber-700 dark:text-amber-300'>
                    {successResults.length} succeeded, {failedResults.length}{' '}
                    failed
                  </p>
                </div>
              </>
            )}
          </div>

          {hasFailures && onRetryFailed && (
            <Button
              variant='outline'
              onClick={onRetryFailed}
              className='gap-2 border-amber-300 bg-white text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
            >
              <RefreshCw className='h-4 w-4' />
              Retry Failed
            </Button>
          )}
        </div>
      </div>

      {/* Failed entries — shown first, scrollable when many */}
      {failedResults.length > 0 && (
        <div className='max-h-56 space-y-2 overflow-y-auto pr-2'>
          <p className='px-1 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300'>
            Failed Entries
          </p>
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
