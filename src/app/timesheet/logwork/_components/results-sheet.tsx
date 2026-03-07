'use client';

import { useState } from 'react';

import { CheckCircle2, ChevronDown, RefreshCw, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { LogWorkResult } from '@/types/timesheet';

interface ResultsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: LogWorkResult[];
  onRetryFailed?: () => void;
}

export function ResultsSheet({
  open,
  onOpenChange,
  results,
  onRetryFailed,
}: ResultsSheetProps) {
  const [failedOpen, setFailedOpen] = useState(true);
  const [succeededOpen, setSucceededOpen] = useState(false);

  const successResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col overflow-hidden sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Submission Results</SheetTitle>
          <SheetDescription>
            {successResults.length > 0 && (
              <span className='text-green-600 dark:text-green-400'>
                {successResults.length} succeeded
              </span>
            )}
            {successResults.length > 0 && failedResults.length > 0 && ', '}
            {failedResults.length > 0 && (
              <span className='text-red-600 dark:text-red-400'>
                {failedResults.length} failed
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 space-y-3 overflow-y-auto px-4'>
          {/* Failed section */}
          {failedResults.length > 0 && (
            <Collapsible open={failedOpen} onOpenChange={setFailedOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type='button'
                  className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20'
                >
                  <XCircle className='h-4 w-4 shrink-0' />
                  <span>
                    {failedResults.length} failed{' '}
                    {failedResults.length === 1 ? 'entry' : 'entries'}
                  </span>
                  <ChevronDown
                    className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                      failedOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className='mt-1 space-y-2 pl-2'>
                  {failedResults.map(result => (
                    <div
                      key={result.entry.id}
                      className='rounded-md border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-900 dark:bg-red-950/30'
                    >
                      <div className='flex items-center gap-2'>
                        <XCircle className='h-3.5 w-3.5 shrink-0 text-red-500 dark:text-red-400' />
                        <span className='font-mono text-sm font-medium text-red-800 dark:text-red-300'>
                          {result.entry.issueKey}
                        </span>
                      </div>
                      {result.error && (
                        <p className='mt-1 pl-5.5 text-xs leading-relaxed text-red-600 dark:text-red-400'>
                          {result.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Succeeded section */}
          {successResults.length > 0 && (
            <Collapsible open={succeededOpen} onOpenChange={setSucceededOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type='button'
                  className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/20'
                >
                  <CheckCircle2 className='h-4 w-4 shrink-0' />
                  <span>
                    {successResults.length} succeeded{' '}
                    {successResults.length === 1 ? 'entry' : 'entries'}
                  </span>
                  <ChevronDown
                    className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                      succeededOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className='mt-1 space-y-1 pl-6'>
                  {successResults.map(result => (
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
          )}
        </div>

        {failedResults.length > 0 && onRetryFailed && (
          <SheetFooter>
            <Button
              onClick={onRetryFailed}
              variant='outline'
              className='gap-1.5 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30'
            >
              <RefreshCw className='h-3.5 w-3.5' />
              Retry Failed
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
