'use client';

import { memo, useCallback } from 'react';

import { Loader2, Trash2 } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { getWorklogKey } from '@/hooks/use-worklogs';
import {
  formatDisplayDate,
  getStatusVariant,
  getWorkTypeBadgeClass,
} from '@/lib/timesheet';
import type { WorklogEntry } from '@/types/timesheet';

interface WorklogRowProps {
  worklog: WorklogEntry;
  isSelected: boolean;
  isDeleting: boolean;
  onToggleSelect: (key: string) => void;
  onDelete: (worklogId: number, issueId: number) => void;
}

export const WorklogRow = memo(function WorklogRow({
  worklog,
  isSelected,
  isDeleting,
  onToggleSelect,
  onDelete,
}: WorklogRowProps) {
  const key = getWorklogKey(worklog);
  const isApproved = worklog.statusWorklog?.toLowerCase() === 'approved';
  const displayDate = worklog.startDateEdit
    ? formatDisplayDate(worklog.startDateEdit)
    : worklog.startDate;

  const handleToggle = useCallback(
    () => onToggleSelect(key),
    [key, onToggleSelect]
  );

  const handleDelete = useCallback(
    () => onDelete(worklog.id, worklog.issueId),
    [worklog.id, worklog.issueId, onDelete]
  );

  return (
    <TableRow data-state={isSelected ? 'selected' : undefined}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleToggle}
          disabled={isApproved}
          aria-label={`Select ${worklog.issueKey}`}
        />
      </TableCell>
      <TableCell className='font-mono font-medium'>
        {worklog.issueKey}
      </TableCell>
      <TableCell className='max-w-[200px] truncate'>
        {worklog.description || '-'}
      </TableCell>
      <TableCell className='text-right font-medium'>
        {parseFloat(String(worklog.worked))}h
      </TableCell>
      <TableCell>
        <Badge
          variant='outline'
          className={getWorkTypeBadgeClass(worklog.typeOfWork)}
        >
          {worklog.typeOfWork}
        </Badge>
      </TableCell>
      <TableCell className='text-nowrap'>{displayDate}</TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(worklog.statusWorklog)}>
          {worklog.statusWorklog}
        </Badge>
      </TableCell>
      <TableCell>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              aria-label='Delete'
              variant='ghost'
              size='icon'
              className='h-8 w-8 text-destructive hover:bg-destructive hover:text-white'
              disabled={isApproved || isDeleting}
              title={
                isApproved
                  ? 'Cannot delete an approved worklog'
                  : 'Delete worklog'
              }
            >
              {isDeleting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Trash2 className='h-4 w-4' />
              )}
              <span className='sr-only'>Delete</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Worklog</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this worklog for{' '}
                <span className='font-semibold'>{worklog.issueKey}</span> (
                {parseFloat(String(worklog.worked))}h on {displayDate}
                )? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant='destructive' onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
});
