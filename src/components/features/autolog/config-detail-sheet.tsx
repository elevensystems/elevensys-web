'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Loader2,
  Pencil,
  Play,
  Trash2,
} from 'lucide-react';

import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import type { AutologConfig } from '@/types/autolog';
import { DAY_NAMES } from '@/types/autolog';

interface ConfigDetailSheetProps {
  config: AutologConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (configId: string) => Promise<boolean>;
  onRun: (configId: string) => Promise<boolean>;
}

const STATUS_LABELS: Record<AutologConfig['status'], string> = {
  active: 'Active',
  paused_auth: 'Paused — Re-auth required',
};

const RUN_STATUS_LABELS: Record<
  NonNullable<AutologConfig['lastRunStatus']>,
  string
> = {
  success: 'Success',
  partial: 'Partial',
  nothing_to_log: 'Nothing to log',
  failed: 'Failed',
};

const RUN_STATUS_VARIANTS: Record<
  NonNullable<AutologConfig['lastRunStatus']>,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  success: 'default',
  partial: 'secondary',
  nothing_to_log: 'outline',
  failed: 'destructive',
};

function formatSchedule(config: AutologConfig): string {
  const { schedule } = config;
  const hourStr = `${String(schedule.hour).padStart(2, '0')}:00 UTC`;
  if (schedule.type === 'weekly') {
    return `Every ${DAY_NAMES[schedule.dayOfWeek ?? 5]} at ${hourStr}`;
  }
  const day = schedule.dayOfMonth ?? 1;
  const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
  return `Monthly on the ${day}${suffix} at ${hourStr}`;
}

export function ConfigDetailSheet({
  config,
  open,
  onOpenChange,
  onDelete,
  onRun,
}: ConfigDetailSheetProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isRunning, setIsRunning] = useState(false);
  const [runSuccess, setRunSuccess] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!config) return null;

  const handleRun = async () => {
    setIsRunning(true);
    setRunSuccess(false);
    const ok = await onRun(config.configId);
    setIsRunning(false);
    if (ok) {
      setRunSuccess(true);
      setTimeout(() => setRunSuccess(false), 2000);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const ok = await onDelete(config.configId);
    setIsDeleting(false);
    if (ok) {
      setShowDeleteDialog(false);
      onOpenChange(false);
    }
  };

  const handleEdit = () => {
    onOpenChange(false);
    router.push(`/timesheet/autolog/${config.configId}/edit`);
  };

  const totalHours = config.tickets.reduce((sum, t) => sum + t.hours, 0);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={
            isMobile
              ? 'max-h-[70vh] overflow-y-auto rounded-t-2xl'
              : 'sm:max-w-md overflow-y-auto'
          }
        >
          <SheetHeader>
            <div className='flex items-start justify-between gap-2'>
              <div>
                <SheetTitle>{config.projectName}</SheetTitle>
                <SheetDescription>{config.projectKey}</SheetDescription>
              </div>
              <Badge
                variant={config.status === 'active' ? 'default' : 'destructive'}
              >
                {STATUS_LABELS[config.status]}
              </Badge>
            </div>
          </SheetHeader>

          <div className='space-y-4 px-4 py-2'>
            {/* Schedule */}
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Calendar className='h-4 w-4 shrink-0' />
              <span>{formatSchedule(config)}</span>
            </div>

            {/* Tickets */}
            <div className='space-y-1.5'>
              <p className='text-xs font-medium text-muted-foreground'>
                Tickets ({config.tickets.length}) &middot; {totalHours}h total
              </p>
              <div className='rounded-md border p-2 space-y-1'>
                {config.tickets.map(t => (
                  <div
                    key={t.issueKey}
                    className='flex items-center justify-between text-sm'
                  >
                    <span className='font-mono text-xs'>{t.issueKey}</span>
                    <span className='text-muted-foreground'>{t.hours}h</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last run */}
            {config.lastRunAt && (
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Clock className='h-3.5 w-3.5 shrink-0' />
                <span>
                  Last run: {new Date(config.lastRunAt).toLocaleString()}
                </span>
                {config.lastRunStatus && (
                  <Badge
                    variant={RUN_STATUS_VARIANTS[config.lastRunStatus]}
                    className='text-xs py-0'
                  >
                    {RUN_STATUS_LABELS[config.lastRunStatus]}
                  </Badge>
                )}
              </div>
            )}

            {/* Re-auth warning */}
            {config.status === 'paused_auth' && (
              <div className='flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive'>
                <AlertTriangle className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                <span>
                  Jira token expired. Update your token to resume autolog.
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <SheetFooter className='flex-row gap-2 border-t px-4 pt-4'>
            {config.status === 'paused_auth' ? (
              <Button className='flex-1' onClick={handleEdit}>
                Re-authenticate
              </Button>
            ) : (
              <Button
                variant='outline'
                onClick={handleRun}
                disabled={isRunning || runSuccess}
              >
                {isRunning ? (
                  <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                ) : runSuccess ? (
                  <Check className='mr-1.5 h-3.5 w-3.5' />
                ) : (
                  <Play className='mr-1.5 h-3.5 w-3.5' />
                )}
                {isRunning ? 'Running...' : runSuccess ? 'Done' : 'Run Now'}
              </Button>
            )}
            <Button variant='outline' onClick={handleEdit}>
              <Pencil className='mr-1.5 h-3.5 w-3.5' />
              Edit
            </Button>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className='h-4 w-4 text-destructive' />
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DeleteConfirmDialog
        title='Delete configuration?'
        description={
          <>
            This will permanently delete the autolog configuration for{' '}
            <strong>{config.projectName}</strong>. This action cannot be undone.
          </>
        }
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
