'use client';

import { EraserIcon, Trash2 } from 'lucide-react';

import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { ActionButton } from '@/components/action-button';
import { CardAction } from '@/components/ui/card';

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
        <DeleteConfirmDialog
          title={`Delete ${selectedCount} Worklog${selectedCount !== 1 ? 's' : ''}`}
          description={
            <>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>{selectedCount}</span> selected
              worklog
              {selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
            </>
          }
          confirmLabel={`Delete ${selectedCount} Worklog${selectedCount !== 1 ? 's' : ''}`}
          onConfirm={onBulkDelete}
          trigger={
            <ActionButton
              variant='destructive'
              size='sm'
              leftIcon={<Trash2 />}
              isLoading={isBulkDeleting}
              loadingText={`Deleting... ${bulkDeleteProgress}%`}
            >
              Delete
            </ActionButton>
          }
        />
        <ActionButton variant='ghost' size='sm' onClick={onClearSelection} leftIcon={<EraserIcon />}>
          Clear
        </ActionButton>
      </div>
    </CardAction>
  );
}
