'use client';

import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AutoLogworkTicket } from '@/types/auto-logwork';

interface TicketRowProps {
  ticket: AutoLogworkTicket;
  index: number;
  onChange: (index: number, field: keyof AutoLogworkTicket, value: string | number) => void;
  onRemove: (index: number) => void;
}

export function TicketRow({ ticket, index, onChange, onRemove }: TicketRowProps) {
  return (
    <div className='flex items-start gap-2'>
      <div className='flex-1'>
        <Input
          placeholder='Issue key (e.g. PROJ-123)'
          value={ticket.issueKey}
          onChange={(e) => onChange(index, 'issueKey', e.target.value.toUpperCase())}
        />
      </div>
      <div className='w-20'>
        <Input
          type='number'
          min={0.5}
          max={8}
          step={0.5}
          placeholder='Hours'
          value={ticket.hours}
          onChange={(e) => onChange(index, 'hours', parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className='flex-1'>
        <Input
          placeholder='Description (optional)'
          value={ticket.description ?? ''}
          onChange={(e) => onChange(index, 'description', e.target.value)}
        />
      </div>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => onRemove(index)}
        aria-label='Remove ticket'
      >
        <Trash2 className='h-4 w-4 text-destructive' />
      </Button>
    </div>
  );
}
