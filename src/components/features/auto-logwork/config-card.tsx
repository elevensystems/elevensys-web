'use client';

import { useState } from 'react';

import { Calendar, Clock, Pencil, Play, Trash2, AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { AutoLogworkConfig } from '@/types/auto-logwork';
import { DAY_NAMES } from '@/types/auto-logwork';

interface ConfigCardProps {
  config: AutoLogworkConfig;
  onEdit: (config: AutoLogworkConfig) => void;
  onDelete: (configId: string) => Promise<void>;
  onRun: (configId: string) => Promise<void>;
  onReauth: (config: AutoLogworkConfig) => void;
}

const STATUS_LABELS: Record<AutoLogworkConfig['status'], string> = {
  active: 'Active',
  paused_auth: 'Paused — Re-auth required',
};

const RUN_STATUS_LABELS: Record<
  NonNullable<AutoLogworkConfig['lastRunStatus']>,
  string
> = {
  success: 'Success',
  partial: 'Partial',
  nothing_to_log: 'Nothing to log',
  failed: 'Failed',
};

const RUN_STATUS_VARIANTS: Record<
  NonNullable<AutoLogworkConfig['lastRunStatus']>,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  success: 'default',
  partial: 'secondary',
  nothing_to_log: 'outline',
  failed: 'destructive',
};

function formatSchedule(config: AutoLogworkConfig): string {
  const { schedule } = config;
  const hourStr = `${String(schedule.hour).padStart(2, '0')}:00 UTC`;
  if (schedule.type === 'weekly') {
    return `Every ${DAY_NAMES[schedule.dayOfWeek ?? 5]} at ${hourStr}`;
  }
  const day = schedule.dayOfMonth ?? 1;
  const suffix =
    day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
  return `Monthly on the ${day}${suffix} at ${hourStr}`;
}

export function ConfigCard({
  config,
  onEdit,
  onDelete,
  onRun,
  onReauth,
}: ConfigCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this auto-logwork configuration?')) return;
    setIsDeleting(true);
    await onDelete(config.configId);
    setIsDeleting(false);
  };

  const handleRun = async () => {
    setIsRunning(true);
    await onRun(config.configId);
    setIsRunning(false);
  };

  return (
    <Card className={config.status === 'paused_auth' ? 'border-destructive/50' : ''}>
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between gap-2'>
          <div>
            <CardTitle className='text-base'>{config.projectName}</CardTitle>
            <CardDescription className='text-xs'>{config.projectKey}</CardDescription>
          </div>
          <Badge
            variant={config.status === 'active' ? 'default' : 'destructive'}
          >
            {STATUS_LABELS[config.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        {/* Schedule */}
        <div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
          <Calendar className='h-3.5 w-3.5' />
          <span>{formatSchedule(config)}</span>
        </div>

        {/* Tickets */}
        <div className='space-y-1'>
          {config.tickets.map((t) => (
            <div key={t.issueKey} className='flex items-center justify-between text-sm'>
              <span className='font-mono text-xs'>{t.issueKey}</span>
              <span className='text-muted-foreground'>{t.hours}h</span>
            </div>
          ))}
        </div>

        {/* Last run */}
        {config.lastRunAt && (
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <Clock className='h-3 w-3' />
            <span>Last run: {new Date(config.lastRunAt).toLocaleString()}</span>
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
          <div className='flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive'>
            <AlertTriangle className='mt-0.5 h-3.5 w-3.5 shrink-0' />
            <span>
              Jira token expired. Update your token to resume auto-logwork.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className='flex gap-2 pt-1'>
          {config.status === 'paused_auth' ? (
            <Button
              variant='default'
              size='sm'
              onClick={() => onReauth(config)}
              className='flex-1'
            >
              Re-authenticate
            </Button>
          ) : (
            <Button
              variant='outline'
              size='sm'
              onClick={handleRun}
              disabled={isRunning}
            >
              <Play className='mr-1 h-3.5 w-3.5' />
              {isRunning ? 'Running…' : 'Run Now'}
            </Button>
          )}
          <Button variant='ghost' size='sm' onClick={() => onEdit(config)}>
            <Pencil className='h-3.5 w-3.5' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className='h-3.5 w-3.5 text-destructive' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
