'use client';

import { useState } from 'react';

import { X } from 'lucide-react';

const COLLAPSE_LIMIT = 11;

interface DateChipListProps {
  dates: Date[];
  onRemove: (date: Date) => void;
}

function formatChip(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

export function DateChipList({ dates, onRemove }: DateChipListProps) {
  const [expanded, setExpanded] = useState(false);

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const collapsed = !expanded && sorted.length > COLLAPSE_LIMIT;
  const visible = collapsed ? sorted.slice(0, COLLAPSE_LIMIT) : sorted;
  const hiddenCount = sorted.length - COLLAPSE_LIMIT;

  return (
    <div className='flex flex-wrap gap-1.5 min-h-[26px] items-center'>
      {dates.length === 0 && (
        <span className='text-xs text-muted-foreground italic'>
          No dates selected. Use &quot;Find Dates&quot; or add manually below.
        </span>
      )}
      {visible.map(date => (
        <button
          key={date.toISOString()}
          type='button'
          onClick={() => onRemove(date)}
          className='inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium hover:bg-destructive hover:text-white hover:border-destructive transition-colors'
          title={`Remove ${formatChip(date)}`}
        >
          {formatChip(date)}
          <X className='size-3' />
        </button>
      ))}

      {collapsed && (
        <button
          type='button'
          onClick={() => setExpanded(true)}
          className='inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors'
        >
          +{hiddenCount} more
        </button>
      )}

      {expanded && sorted.length > COLLAPSE_LIMIT && (
        <button
          type='button'
          onClick={() => setExpanded(false)}
          className='inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors'
        >
          Show less
        </button>
      )}
    </div>
  );
}
