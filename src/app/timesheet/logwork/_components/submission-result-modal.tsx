'use client';

import { useEffect, useState } from 'react';

import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { LogWorkResult } from '@/types/timesheet';

interface SubmissionResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: LogWorkResult[];
  isSubmitting: boolean;
  onRetryFailed?: () => void;
}

function FailedResultItem({ result }: { result: LogWorkResult }) {
  return (
    <div className='rounded-lg border border-red-200 bg-red-50/60 p-4 dark:border-red-900/50 dark:bg-red-950/30'>
      <div className='flex items-start gap-3'>
        <XCircle className='mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400' />
        <div className='flex-1 min-w-0'>
          <p className='font-mono text-sm font-semibold text-red-900 dark:text-red-200'>
            {result.entry.issueKey}
          </p>
          {result.error && (
            <p className='mt-2 text-xs leading-relaxed text-red-700 dark:text-red-300'>
              {result.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function SubmissionResultModal({
  open,
  onOpenChange,
  results,
  isSubmitting,
  onRetryFailed,
}: SubmissionResultModalProps) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setAnimateIn(true), 50);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
    }
  }, [open]);

  const successResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);
  const allSucceeded = failedResults.length === 0 && successResults.length > 0;
  const hasFailures = failedResults.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-2xl transition-all duration-300 ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
        showCloseButton={!isSubmitting}
      >
        {/* Header */}
        <DialogHeader>
          <div className='flex items-start gap-4'>
            <div
              className={`rounded-full p-3 ${
                allSucceeded
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-amber-100 dark:bg-amber-900/30'
              }`}
            >
              {allSucceeded ? (
                <CheckCircle2 className='h-6 w-6 text-green-600 dark:text-green-400' />
              ) : (
                <XCircle className='h-6 w-6 text-amber-600 dark:text-amber-400' />
              )}
            </div>
            <div className='flex-1'>
              <DialogTitle>
                {allSucceeded ? 'All entries logged successfully' : 'Submission complete'}
              </DialogTitle>
              <DialogDescription className='mt-2'>
                {allSucceeded ? (
                  <span>
                    Your {successResults.length} work{' '}
                    {successResults.length === 1 ? 'entry' : 'entries'} have been
                    submitted to Jira.
                  </span>
                ) : (
                  <span>
                    {successResults.length} of {successResults.length + failedResults.length}{' '}
                    entries were logged. {failedResults.length} entries failed.
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className='space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-4'>
          {/* Success summary */}
          {successResults.length > 0 && (
            <div className='rounded-lg border border-green-200 bg-green-50/60 p-4 dark:border-green-900/50 dark:bg-green-950/30'>
              <div className='flex items-center gap-3'>
                <div className='rounded-full bg-green-200 p-2 dark:bg-green-900/50'>
                  <CheckCircle2 className='h-5 w-5 text-green-600 dark:text-green-400' />
                </div>
                <div>
                  <p className='font-semibold text-green-900 dark:text-green-100'>
                    {successResults.length} successful submission
                    {successResults.length !== 1 ? 's' : ''}
                  </p>
                  <p className='text-xs text-green-700 dark:text-green-300'>
                    Logged to your Jira timesheet
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Failed entries */}
          {failedResults.length > 0 && (
            <div className='space-y-3'>
              <div>
                <h3 className='text-sm font-semibold text-red-900 dark:text-red-100'>
                  Failed Entries ({failedResults.length})
                </h3>
                <p className='text-xs text-red-700 dark:text-red-300'>
                  These entries could not be logged. Please review the errors and try again.
                </p>
              </div>
              <div className='space-y-2'>
                {failedResults.map(result => (
                  <FailedResultItem key={result.entry.id} result={result} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className='flex-col sm:flex-row gap-2'>
          {hasFailures && onRetryFailed && (
            <Button
              onClick={onRetryFailed}
              disabled={isSubmitting}
              variant='outline'
              className='order-2 sm:order-1'
            >
              <RefreshCw className='h-4 w-4' />
              Retry Failed Entries
            </Button>
          )}
          <Button
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className='order-1 sm:order-2'
          >
            {allSucceeded ? 'Done' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
