'use client';

import { EraserIcon, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { CardAction } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface BulkDeleteActionProps {
  selectedCount: number;
  isBulkDeleting: boolean;
  bulkDeleteProgress: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

export function BulkDeleteAction({
  selectedCount,
  isBulkDeleting,
  bulkDeleteProgress,
  onBulkDelete,
  onClearSelection,
}: BulkDeleteActionProps) {
  if (selectedCount === 0) return null;

  return (
    <CardAction>
      <div className='flex items-center gap-2'>
        <span className='text-sm text-muted-foreground'>
          {selectedCount} selected
        </span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant='destructive' size='sm' disabled={isBulkDeleting}>
              {isBulkDeleting ? <Spinner /> : <Trash2 className='h-4 w-4' />}
              {isBulkDeleting ? `Deleting... ${bulkDeleteProgress}%` : 'Delete'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {selectedCount} Worklog
                {selectedCount !== 1 ? 's' : ''}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{' '}
                <span className='font-semibold'>{selectedCount}</span> selected
                worklog
                {selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant='destructive' onClick={onBulkDelete}>
                Delete {selectedCount} Worklog
                {selectedCount !== 1 ? 's' : ''}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button variant='ghost' size='sm' onClick={onClearSelection}>
          <EraserIcon />
          Clear
        </Button>
      </div>
    </CardAction>
  );
}
