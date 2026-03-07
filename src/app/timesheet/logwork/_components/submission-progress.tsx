'use client';

import { useState } from 'react';

import { CheckCircle2 } from 'lucide-react';

import { Spinner } from '@/components/ui/spinner';
import type { LogWorkResult } from '@/types/timesheet';

import { SubmissionResultModal } from './submission-result-modal';

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

export function SubmissionProgress({
  isSubmitting,
  progress,
  progressText,
  results,
  onRetryFailed,
}: SubmissionProgressProps) {
  const [showResultModal, setShowResultModal] = useState(false);

  // Show progress bar only while submitting
  if (isSubmitting) {
    return <ProgressBar progress={progress} progressText={progressText} />;
  }

  // Show result modal after submission completes
  if (!isSubmitting && results.length > 0) {
    return (
      <>
        {/* Quick visual feedback while modal opens */}
        <div className='animate-in fade-in duration-300 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50/60 px-4 py-3 dark:border-green-900/50 dark:bg-green-950/30'>
          <CheckCircle2 className='h-5 w-5 text-green-600 dark:text-green-400' />
          <div className='flex-1'>
            <p className='text-sm font-medium text-green-900 dark:text-green-100'>
              Submission complete. Review results...
            </p>
          </div>
          <button
            onClick={() => setShowResultModal(true)}
            className='text-sm font-medium text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 underline'
          >
            View Details
          </button>
        </div>

        <SubmissionResultModal
          open={showResultModal}
          onOpenChange={setShowResultModal}
          results={results}
          isSubmitting={isSubmitting}
          onRetryFailed={onRetryFailed}
        />
      </>
    );
  }

  return null;
}
