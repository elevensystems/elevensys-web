'use client';

import { memo, useCallback } from 'react';

import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import {
  HOUR_STEP,
  MIN_HOURS,
} from '@/lib/timesheet';
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
  onUpdate: (id: string, field: keyof WorkEntry, value: string | number) => void;
  onRemove: (id: string) => void;
}

export const WorkEntryRow = memo(function WorkEntryRow({
  entry,
  issues,
  issuesByKey,
  isLoadingIssues,
  onUpdate,
  onRemove,
}: WorkEntryRowProps) {
  const handleIssueInputChange = useCallback(
    (value: string) => onUpdate(entry.id, 'issueKey', value),
    [entry.id, onUpdate]
  );

  const handleIssueSelect = useCallback(
    (value: JiraIssue | null) => {
      onUpdate(entry.id, 'issueKey', value?.key ?? '');
      onUpdate(entry.id, 'description', value?.summary ?? '');
    },
    [entry.id, onUpdate]
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
            placeholder={
              isLoadingIssues ? 'Loading...' : 'Select ticket'
            }
            className='h-8 font-mono'
            disabled={isLoadingIssues}
            showClear
          />
          <ComboboxContent>
            <ComboboxList>
              {(issue: JiraIssue) => (
                <ComboboxItem key={issue.id} value={issue}>
                  <span className='font-mono shrink-0'>
                    {issue.key}
                  </span>
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
        <NativeSelect
          value={entry.typeOfWork}
          onChange={handleTypeChange}
        >
          {WORK_TYPES.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </NativeSelect>
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
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 text-muted-foreground hover:text-destructive'
          onClick={handleRemove}
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </TableCell>
    </TableRow>
  );
});
