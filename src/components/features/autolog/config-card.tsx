'use client';

import { Calendar } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { AutologConfig } from '@/types/autolog';
import { DAY_NAMES } from '@/types/autolog';

interface ConfigCardProps {
  config: AutologConfig;
  onClick: (config: AutologConfig) => void;
}

function formatSchedule(config: AutologConfig): string {
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

export function ConfigCard({ config, onClick }: ConfigCardProps) {
  const totalHours = config.tickets.reduce((sum, t) => sum + t.hours, 0);

  return (
    <Card
      className='cursor-pointer transition-colors hover:bg-accent/50'
      onClick={() => onClick(config)}
    >
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between gap-2'>
          <div>
            <CardTitle className='text-base'>{config.projectName}</CardTitle>
            <CardDescription className='text-xs'>
              {config.projectKey}
            </CardDescription>
          </div>
          <Badge
            variant={config.status === 'active' ? 'default' : 'destructive'}
          >
            {config.status === 'active' ? 'Active' : 'Paused'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='flex items-center gap-3 text-sm text-muted-foreground'>
        <Calendar className='h-3.5 w-3.5 shrink-0' />
        <span className='truncate'>{formatSchedule(config)}</span>
        <span className='ml-auto shrink-0 font-medium text-foreground'>
          {totalHours}h
        </span>
      </CardContent>
    </Card>
  );
}
