'use client';

import { useEffect } from 'react';

import { useForm } from '@tanstack/react-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { WORK_TYPES } from '@/types/timesheet';
import type { MyWorklogsRow, UpdateWorklogRequest } from '@/types/timesheet';

const editWorklogSchema = z.object({
  startDateEdit: z.string().min(1, 'Date is required'),
  worked: z
    .string()
    .min(1, 'Hours is required')
    .refine(val => !Number.isNaN(Number(val)) && Number(val) >= 0.1, {
      message: 'Minimum is 0.1 hours',
    })
    .refine(val => !Number.isNaN(Number(val)) && Number(val) <= 8, {
      message: 'Maximum is 8 hours',
    }),
  typeOfWork: z.string().min(1, 'Type of work is required'),
  description: z.string().min(1, 'Description is required'),
});

interface EditWorklogModalProps {
  worklog: MyWorklogsRow | null;
  isEditing: boolean;
  onClose: () => void;
  onSave: (
    worklog: MyWorklogsRow,
    changes: Omit<UpdateWorklogRequest, 'id' | 'jiraInstance'>
  ) => void;
}

/**
 * Convert Jira date format "DD/Mon/YY" to ISO "YYYY-MM-DD" for the date input.
 * Falls back to the raw string if parsing fails.
 */
function jiraDateToISO(dateStr: string): string {
  const match = dateStr.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2})$/);
  if (!match) return dateStr;
  const [, day, monthAbbr, yearShort] = match;
  const months: Record<string, string> = {
    jan: '01',
    feb: '02',
    mar: '03',
    apr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    aug: '08',
    sep: '09',
    oct: '10',
    nov: '11',
    dec: '12',
  };
  const mm = months[monthAbbr.toLowerCase()];
  if (!mm) return dateStr;
  const yyyy = `20${yearShort}`;
  return `${yyyy}-${mm}-${day.padStart(2, '0')}`;
}

/**
 * Convert ISO "YYYY-MM-DD" back to Jira format "D/Mon/YY".
 */
function isoToJiraDate(isoStr: string): string {
  const date = new Date(isoStr + 'T00:00:00');
  const day = date.getDate();
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function getDefaultValues(worklog: MyWorklogsRow) {
  return {
    description: worklog.description ?? '',
    worked: String(parseFloat(String(worklog.worked))),
    typeOfWork: worklog.typeOfWork ?? '',
    startDateEdit: worklog.startDateEdit
      ? jiraDateToISO(worklog.startDateEdit)
      : worklog.startDate
        ? jiraDateToISO(worklog.startDate)
        : '',
  };
}

export function EditWorklogModal({
  worklog,
  isEditing,
  onClose,
  onSave,
}: EditWorklogModalProps) {
  const form = useForm({
    defaultValues: {
      startDateEdit: '',
      worked: '',
      typeOfWork: '',
      description: '',
    },
    validators: { onSubmit: editWorklogSchema },
    onSubmit: ({ value }) => {
      if (!worklog) return;

      const defaults = getDefaultValues(worklog);
      const changes: Omit<UpdateWorklogRequest, 'id' | 'jiraInstance'> = {};

      if (value.description !== defaults.description) {
        changes.description = value.description;
      }

      if (value.worked !== defaults.worked) {
        changes.worked = value.worked;
      }

      if (value.typeOfWork !== defaults.typeOfWork) {
        changes.typeOfWork = value.typeOfWork;
      }

      const originalDate = worklog.startDateEdit || worklog.startDate || '';
      const newJiraDate = value.startDateEdit
        ? isoToJiraDate(value.startDateEdit)
        : '';
      if (newJiraDate !== originalDate) {
        changes.startDateEdit = newJiraDate;
      }

      onSave(worklog, changes);
    },
  });

  useEffect(() => {
    if (worklog) {
      form.reset(getDefaultValues(worklog));
    }
  }, [worklog?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={!!worklog} onOpenChange={open => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Edit Worklog</DialogTitle>
          <DialogDescription>
            Editing worklog for{' '}
            <span className='font-semibold'>{worklog?.issueKey}</span>
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <form.Field
            name='startDateEdit'
            children={field => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor='edit-date'>Date</FieldLabel>
                  <DatePicker
                    id='edit-date'
                    value={field.state.value}
                    onChange={val => field.handleChange(val)}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name='worked'
            children={field => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor='edit-hours'>Hours</FieldLabel>
                  <Input
                    id='edit-hours'
                    type='number'
                    min='0.1'
                    max='24'
                    step='0.1'
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name='typeOfWork'
            children={field => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor='edit-type'>Type of Work</FieldLabel>
                  <NativeSelect
                    id='edit-type'
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  >
                    {WORK_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </NativeSelect>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name='description'
            children={field => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor='edit-description'>
                    Description
                  </FieldLabel>
                  <Textarea
                    id='edit-description'
                    rows={3}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isEditing}>
            Cancel
          </Button>
          <Button onClick={() => form.handleSubmit()} disabled={isEditing}>
            {isEditing ? <Spinner /> : null}
            {isEditing ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
