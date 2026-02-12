'use client';

import type { LogWorkResult } from '@/types/timesheet';

interface SubmissionProgressProps {
  isSubmitting: boolean;
  progress: number;
  progressText: string;
  results: LogWorkResult[];
}

export function SubmissionProgress({
  isSubmitting,
  progress,
  progressText,
  results,
}: SubmissionProgressProps) {
  if (!isSubmitting && results.length === 0) return null;

  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>{progressText}</span>
          <span className='font-medium'>{progress}%</span>
        </div>
        <div className='h-2 w-full rounded-full bg-muted'>
          <div
            className='h-full rounded-full bg-primary transition-all duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && !isSubmitting && (
        <div className='space-y-2'>
          {results.map(result => (
            <div
              key={result.entry.id}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                result.success
                  ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300'
              }`}
            >
              <span className='font-mono'>{result.entry.issueKey}</span>
              <span>
                {result.success ? 'Logged successfully' : result.error}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
