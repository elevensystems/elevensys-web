'use client';

import { memo, useCallback } from 'react';

import { MoreHorizontalIcon, SquarePenIcon, Trash2Icon } from 'lucide-react';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getWorklogKey } from '@/hooks/use-worklogs';
import {
  formatDisplayDate,
  getStatusVariant,
  getWorkTypeBadgeClass,
} from '@/lib/timesheet';
import type { MyWorklogsRow } from '@/types/timesheet';

interface WorklogRowProps {
  worklog: MyWorklogsRow;
  isSelected: boolean;
  isDeleting: boolean;
  onToggleSelect: (key: string) => void;
  onDelete: (worklogId: number, issueId: number) => void;
  onEdit: (worklog: MyWorklogsRow) => void;
}

export const WorklogRow = memo(function WorklogRow({
  worklog,
  isSelected,
  isDeleting,
  onToggleSelect,
  onDelete,
  onEdit,
}: WorklogRowProps) {
  const key = getWorklogKey(worklog);
  const EDITABLE_STATUSES = ['pending', 'rejected', 'reopened'];
  const isEditable = EDITABLE_STATUSES.includes(
    worklog.statusWorklog?.toLowerCase() ?? ''
  );
  const displayDate = worklog.startDateEdit
    ? formatDisplayDate(worklog.startDateEdit)
    : worklog.startDate;

  const handleToggle = useCallback(
    () => onToggleSelect(key),
    [key, onToggleSelect]
  );

  const handleEdit = useCallback(() => onEdit(worklog), [worklog, onEdit]);

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
          disabled={!isEditable}
          aria-label={`Select ${worklog.issueKey}`}
        />
      </TableCell>
      <TableCell className='font-mono font-semibold'>
        {worklog.issueKey}
      </TableCell>
      <TableCell className='max-w-[200px]'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='block truncate'>
                {worklog.description || '-'}
              </span>
            </TooltipTrigger>
            {worklog.description && (
              <TooltipContent side='bottom' className='max-w-sm'>
                <p>{worklog.description}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
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
      <TableCell className='text-muted-foreground text-nowrap'>
        {worklog.author}
      </TableCell>
      <TableCell>
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='size-8'
                disabled={isDeleting}
              >
                {isDeleting ? <Spinner /> : <MoreHorizontalIcon />}
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={handleEdit} disabled={!isEditable}>
                <SquarePenIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem variant='destructive' disabled={!isEditable}>
                  <Trash2Icon />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
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
