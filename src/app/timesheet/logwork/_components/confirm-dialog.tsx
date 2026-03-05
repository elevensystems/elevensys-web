'use client';

import { CheckCheckIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatDateForApi,
  formatHours,
  getWorkTypeBadgeClass,
} from '@/lib/timesheet';
import type { JiraProject, WorkEntry } from '@/types/timesheet';

interface LogWorkConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  entries: WorkEntry[];
  dateMode: 'range' | 'specific';
  startDate: string;
  endDate: string;
  parsedDates: string[];
  selectedProject?: JiraProject;
  totalHours: number;
}

export function LogWorkConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  entries,
  dateMode,
  startDate,
  endDate,
  parsedDates,
  selectedProject,
  totalHours,
}: LogWorkConfirmDialogProps) {
  const validEntries = entries.filter(e => e.issueKey.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Confirm</DialogTitle>
          <DialogDescription>
            You are about to log the following tickets.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 py-2'>
          {/* Project */}
          {selectedProject && (
            <div className='space-y-1'>
              <p className='text-sm font-medium text-muted-foreground'>
                Project
              </p>
              <p className='text-sm'>
                <span className='font-semibold'>{selectedProject.key}</span>
                <span className='text-muted-foreground'> — </span>
                {selectedProject.name}
              </p>
            </div>
          )}

          {/* Dates */}
          <div className='space-y-1'>
            <p className='text-sm font-medium text-muted-foreground'>Dates</p>
            <div className='flex flex-wrap gap-1.5'>
              {dateMode === 'range' ? (
                <Badge variant='outline' className='font-mono text-xs'>
                  {formatDateForApi(startDate)} → {formatDateForApi(endDate)}
                </Badge>
              ) : (
                parsedDates.map(date => (
                  <Badge
                    key={date}
                    variant='outline'
                    className='font-mono text-xs'
                  >
                    {date}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Tickets */}
          <div className='space-y-1'>
            <p className='text-sm font-medium text-muted-foreground'>Tickets</p>
            <div className='rounded-md border'>
              <Table>
                <TableHeader className='bg-muted'>
                  <TableRow>
                    <TableHead className='font-semibold text-xs h-8'>
                      Ticket
                    </TableHead>
                    <TableHead className='font-semibold text-xs h-8'>
                      Type
                    </TableHead>
                    <TableHead className='font-semibold text-xs h-8 text-right'>
                      Hours
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validEntries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className='font-mono text-sm py-1.5'>
                        {entry.issueKey}
                      </TableCell>
                      <TableCell className='text-sm py-1.5'>
                        <Badge
                          variant='outline'
                          className={getWorkTypeBadgeClass(entry.typeOfWork)}
                        >
                          {entry.typeOfWork}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-sm py-1.5 text-right'>
                        {entry.hours}h
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className='text-xs text-muted-foreground text-right'>
              Total: {formatHours(totalHours)}h
            </p>
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            <CheckCheckIcon className='h-4 w-4' />
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
