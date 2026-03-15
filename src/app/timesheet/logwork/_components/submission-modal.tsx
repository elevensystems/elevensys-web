'use client';

import { useCallback, useMemo, useState } from 'react';

import { CheckCircle2, RefreshCw, X, XCircle } from 'lucide-react';

import { ActionButton } from '@/components/action-button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { LogWorkResult, RequestStatus } from '@/types/timesheet';

import { CancelConfirmDialog } from './cancel-confirm-dialog';
import { EntryStatusList } from './entry-status-list';
import { SegmentedProgressBar } from './segmented-progress-bar';

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface SubmissionModalProps {
  open: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  isCancelled: boolean;
  requestStatuses: RequestStatus[];
  results: LogWorkResult[];
  elapsedSeconds: number;
  onCancel: () => void;
  onRetryFailed: () => void;
}

export function SubmissionModal({
  open,
  onClose,
  isSubmitting,
  isCancelled,
  requestStatuses,
  results,
  elapsedSeconds,
  onCancel,
  onRetryFailed,
}: SubmissionModalProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const successCount = useMemo(
    () => requestStatuses.filter(s => s.status === 'success').length,
    [requestStatuses]
  );

  const failedCount = useMemo(
    () => requestStatuses.filter(s => s.status === 'failed').length,
    [requestStatuses]
  );

  const skippedCount = useMemo(
    () => requestStatuses.filter(s => s.status === 'skipped').length,
    [requestStatuses]
  );

  const isDone = !isSubmitting && requestStatuses.length > 0;

  const title = isSubmitting
    ? 'Submitting Worklogs'
    : isCancelled
      ? 'Submission Cancelled'
      : 'Submission Complete';

  const handleCancelClick = useCallback(() => {
    setShowCancelConfirm(true);
  }, []);

  const handleConfirmCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const summaryLine = useMemo(() => {
    if (!isDone) return null;

    if (isCancelled) {
      const parts: string[] = [];
      if (successCount > 0) parts.push(`${successCount} succeeded`);
      if (failedCount > 0) parts.push(`${failedCount} failed`);
      if (skippedCount > 0) parts.push(`${skippedCount} skipped`);
      return parts.join(', ') || 'No worklogs were submitted.';
    }

    if (failedCount === 0) {
      return `All ${successCount} worklog${successCount !== 1 ? 's' : ''} submitted successfully`;
    }
    if (successCount === 0) {
      return `All ${failedCount} worklog${failedCount !== 1 ? 's' : ''} failed`;
    }
    return `${successCount} succeeded, ${failedCount} failed`;
  }, [isDone, isCancelled, successCount, failedCount, skippedCount]);

  const summaryColor = useMemo(() => {
    if (!isDone) return '';
    if (isCancelled) return 'text-muted-foreground';
    if (failedCount === 0) return 'text-green-600 dark:text-green-400';
    if (successCount === 0) return 'text-red-600 dark:text-red-400';
    return 'text-amber-600 dark:text-amber-400';
  }, [isDone, isCancelled, failedCount, successCount]);

  const SummaryIcon = useMemo(() => {
    if (!isDone) return null;
    if (isCancelled) return XCircle;
    if (failedCount === 0) return CheckCircle2;
    return XCircle;
  }, [isDone, isCancelled, failedCount]);

  const hasFailedResults = results.some(
    r => !r.success && r.error !== 'Cancelled'
  );

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={isOpen => {
          if (!isOpen && isSubmitting) {
            // Pressing ESC during submission triggers cancel
            handleCancelClick();
            return;
          }
          if (!isOpen && !isSubmitting) {
            onClose();
          }
        }}
      >
        <DialogContent
          className='sm:max-w-4xl'
          showCloseButton={false}
          onPointerDownOutside={e => {
            if (isSubmitting) e.preventDefault();
          }}
          onEscapeKeyDown={e => {
            if (isSubmitting) {
              e.preventDefault();
              handleCancelClick();
            }
          }}
        >
          <DialogHeader>
            <div className='flex items-center justify-between'>
              <DialogTitle>{title}</DialogTitle>
              <div className='flex items-center gap-3'>
                <span className='text-sm tabular-nums text-muted-foreground'>
                  {formatElapsed(elapsedSeconds)}
                </span>
                {isSubmitting ? (
                  <ActionButton
                    variant='ghost'
                    size='default'
                    onClick={handleCancelClick}
                    className='h-7 px-2 text-muted-foreground hover:text-destructive'
                  >
                    <X className='size-4' />
                    Cancel
                  </ActionButton>
                ) : null}
              </div>
            </div>
          </DialogHeader>

          <div className='space-y-4'>
            <SegmentedProgressBar statuses={requestStatuses} />

            {isDone && summaryLine && (
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
                  summaryColor
                )}
              >
                {SummaryIcon && <SummaryIcon className='size-4' />}
                {summaryLine}
              </div>
            )}

            <EntryStatusList statuses={requestStatuses} />

            {isDone && (
              <DialogFooter className='border-t pt-3 gap-2'>
                {hasFailedResults && (
                  <ActionButton
                    variant='outline'
                    size='default'
                    onClick={onRetryFailed}
                    leftIcon={<RefreshCw />}
                    className='gap-1.5'
                  >
                    Retry Failed
                  </ActionButton>
                )}
                <ActionButton
                  size='default'
                  onClick={onClose}
                  leftIcon={<X className='size-4' />}
                >
                  Close
                </ActionButton>
              </DialogFooter>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CancelConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirmCancel={handleConfirmCancel}
        successCount={successCount}
      />
    </>
  );
}
