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
  .superRefine((data, ctx) => {
    // Validate dates — parse once, check both conditions
    const dates = parseSpecificDates(data.datesText);

    if (dates.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Please enter at least one date (e.g., 20/Aug/25, 21/Aug/25, 22/Aug/25, 25/Aug/25).',
        path: ['datesText'],
      });
    } else {
      const invalidDate = dates.find(d => !isValidApiDate(d));
      if (invalidDate) {
        ctx.addIssue({
          code: 'custom',
          message: `Invalid date: "${invalidDate}". Expected format: DD/Mon/YY (e.g., 02/Feb/26).`,
          path: ['datesText'],
        });
      }
    }

    // Validate entries — filter once, check all conditions
    const validEntries = data.entries.filter(e => e.issueKey.trim());

    if (validEntries.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please add at least one work entry with an issue key.',
        path: ['entries'],
      });
      return;
    }

    for (const entry of validEntries) {
      if (!isValidIssueKey(entry.issueKey)) {
        ctx.addIssue({
          code: 'custom',
          message: `Invalid issue key: "${entry.issueKey}". Expected format: PROJECT-123 (e.g., C99CMSMKPCM1-01).`,
          path: ['entries'],
        });
      }
      if (entry.hours < MIN_HOURS || entry.hours > MAX_HOURS) {
        ctx.addIssue({
          code: 'custom',
          message: `Hours for ${entry.issueKey} must be between ${MIN_HOURS} and ${MAX_HOURS}.`,
          path: ['entries'],
        });
      }
    }
  });
