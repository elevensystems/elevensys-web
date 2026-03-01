import { z } from 'zod';

import {
  MAX_HOURS,
  MIN_HOURS,
  isValidApiDate,
  isValidIssueKey,
  parseSpecificDates,
} from '@/lib/timesheet';
import { WORK_TYPES } from '@/types/timesheet';

const workEntrySchema = z.object({
  id: z.string(),
  issueKey: z.string(),
  typeOfWork: z.enum(WORK_TYPES),
  description: z.string(),
  hours: z.number(),
});

export const logWorkSchema = z
  .object({
    datesText: z.string(),
    entries: z.array(workEntrySchema),
  })
  .refine(
    data => {
      const dates = parseSpecificDates(data.datesText);
      return dates.length > 0;
    },
    {
      message:
        'Please enter at least one date (e.g., 20/Aug/25, 21/Aug/25, 22/Aug/25, 25/Aug/25).',
      path: ['datesText'],
    }
  )
  .refine(
    data => {
      const dates = parseSpecificDates(data.datesText);
      return dates.every(isValidApiDate);
    },
    {
      message: 'All dates must be in DD/Mon/YY format (e.g., 02/Feb/26).',
      path: ['datesText'],
    }
  )
  .refine(
    data => {
      const validEntries = data.entries.filter(e => e.issueKey.trim());
      return validEntries.length > 0;
    },
    {
      message: 'Please add at least one work entry with an issue key.',
      path: ['entries'],
    }
  )
  .refine(
    data => {
      const validEntries = data.entries.filter(e => e.issueKey.trim());
      return validEntries.every(e => isValidIssueKey(e.issueKey));
    },
    {
      message:
        'All issue keys must match format PROJECT-123 (e.g., C99CMSMKPCM1-01).',
      path: ['entries'],
    }
  )
  .refine(
    data => {
      const validEntries = data.entries.filter(e => e.issueKey.trim());
      return validEntries.every(
        e => e.hours >= MIN_HOURS && e.hours <= MAX_HOURS
      );
    },
    {
      message: `Hours must be between ${MIN_HOURS} and ${MAX_HOURS} for all entries.`,
      path: ['entries'],
    }
  );
