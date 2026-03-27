'use client';

import { memo, useCallback, useState } from 'react';

import { Trash2 } from 'lucide-react';

import { ActionButton } from '@/components/action-button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { HOUR_STEP, MIN_HOURS } from '@/lib/timesheet';
import {
  type JiraIssue,
  WORK_TYPES,
  type WorkEntry,
  type WorkType,
} from '@/types/timesheet';

interface WorkEntryRowProps {
  entry: WorkEntry;
  issues: JiraIssue[];
  issuesByKey: Map<string, JiraIssue>;
  isLoadingIssues: boolean;
  onUpdate: (
    id: string,
    field: keyof WorkEntry,
    value: string | number
  ) => void;
  onRemove: (id: string) => void;
  onFetchTypeOfWork: (issueId: number) => Promise<WorkType | null>;
  disabled?: boolean;
}

export const WorkEntryRow = memo(function WorkEntryRow({
  entry,
  issues,
  issuesByKey,
  isLoadingIssues,
  onUpdate,
  onRemove,
  onFetchTypeOfWork,
  disabled = false,
}: WorkEntryRowProps) {
  const [isFetchingTypeOfWork, setIsFetchingTypeOfWork] = useState(false);

  const handleIssueInputChange = useCallback(
    (value: string, eventDetails: { reason: string }) => {
      if (eventDetails.reason === 'input-clear') return;
      onUpdate(entry.id, 'issueKey', value);
    },
    [entry.id, onUpdate]
  );

  const handleIssueSelect = useCallback(
    (value: JiraIssue | null) => {
      onUpdate(entry.id, 'issueKey', value?.key ?? '');
      onUpdate(entry.id, 'description', value?.summary ?? '');

      if (!value) return;

      // Use cached typeOfWork if available
      if (value.typeOfWork) {
        onUpdate(entry.id, 'typeOfWork', value.typeOfWork);
        return;
      }

      // Fetch in background — row stays fully interactive
      setIsFetchingTypeOfWork(true);
      onFetchTypeOfWork(value.id)
        .then(typeOfWork => {
          if (typeOfWork) {
            onUpdate(entry.id, 'typeOfWork', typeOfWork);
          }
        })
        .catch(() => {
          // Silent failure — field stays on current value
        })
        .finally(() => setIsFetchingTypeOfWork(false));
    },
    [entry.id, onUpdate, onFetchTypeOfWork]
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onUpdate(entry.id, 'description', e.target.value),
    [entry.id, onUpdate]
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      onUpdate(entry.id, 'typeOfWork', e.target.value as WorkType),
    [entry.id, onUpdate]
  );

  const handleHoursChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onUpdate(entry.id, 'hours', parseFloat(e.target.value) || 0),
    [entry.id, onUpdate]
  );

  const handleRemove = useCallback(
    () => onRemove(entry.id),
    [entry.id, onRemove]
  );

  const selectedIssue = issuesByKey.get(entry.issueKey) ?? null;

  return (
    <TableRow>
      <TableCell>
        <Combobox
          items={issues}
          value={selectedIssue}
          inputValue={entry.issueKey}
          onInputValueChange={handleIssueInputChange}
          onValueChange={handleIssueSelect}
          itemToStringLabel={(issue: JiraIssue) => issue.key}
        >
          <ComboboxInput
            placeholder={isLoadingIssues ? 'Loading...' : 'Select ticket'}
            className='h-8'
            disabled={isLoadingIssues || disabled}
            showClear
          />
          <ComboboxContent>
            <ComboboxList>
              {(issue: JiraIssue) => (
                <ComboboxItem key={issue.id} value={issue}>
                  <span className='shrink-0'>{issue.key}</span>
                </ComboboxItem>
              )}
            </ComboboxList>
            <ComboboxEmpty>No issues found</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
      </TableCell>
      <TableCell>
        <Input
          placeholder='Description of work done'
          value={entry.description}
          onChange={handleDescriptionChange}
          maxLength={500}
          className='h-8'
        />
      </TableCell>
      <TableCell>
        {/* Subtle pulse border while background fetch is in flight */}
        <div
          className={cn(
            'rounded-md',
            isFetchingTypeOfWork && 'ring-2 ring-primary/30 animate-pulse'
          )}
        >
          <NativeSelect
            className='h-8'
            value={entry.typeOfWork}
            onChange={handleTypeChange}
          >
            {WORK_TYPES.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </NativeSelect>
        </div>
      </TableCell>
      <TableCell>
        <Input
          type='number'
          min={MIN_HOURS}
          step={HOUR_STEP}
          value={entry.hours || ''}
          onChange={handleHoursChange}
          className='h-8 w-20'
        />
      </TableCell>
      <TableCell>
        <ActionButton
          aria-label='Delete'
          variant='ghost'
          size='icon'
          className='h-8 w-8 text-destructive hover:bg-destructive hover:text-white'
          onClick={handleRemove}
          leftIcon={<Trash2 />}
        />
      </TableCell>
    </TableRow>
  );
});
