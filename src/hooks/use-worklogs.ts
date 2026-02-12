'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  REQUEST_DELAY_MS,
  delay,
  formatDateForApi,
  getMonthEnd,
  getMonthStart,
} from '@/lib/timesheet';
import type { TimesheetSettings, WorklogEntry } from '@/types/timesheet';

export function getWorklogKey(worklog: WorklogEntry): string {
  return `${worklog.id}_${worklog.issueId}`;
}

interface UseWorklogsParams {
  settings: TimesheetSettings;
  isConfigured: boolean;
  isLoaded: boolean;
}

export function useWorklogs({
  settings,
  isConfigured,
  isLoaded,
}: UseWorklogsParams) {
  const [fromDate, setFromDate] = useState(getMonthStart());
  const [toDate, setToDate] = useState(getMonthEnd());
  const [worklogs, setWorklogs] = useState<WorklogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);

  const allSelected =
    worklogs.length > 0 && selectedIds.size === worklogs.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < worklogs.length;

  const totalHours = useMemo(
    () => worklogs.reduce((sum, w) => sum + (Number(w.worked) || 0), 0),
    [worklogs]
  );

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(worklogs.map(getWorklogKey)));
    }
  }, [allSelected, worklogs]);

  const toggleSelect = useCallback((key: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleSearch = useCallback(async () => {
    if (!isConfigured) {
      setError(
        'Please configure your Jira settings on the Log Work page.'
      );
      return;
    }

    if (!fromDate || !toDate) {
      setError('Please select a date range.');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setError('Start date must be before or equal to end date.');
      return;
    }

    setError('');
    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch('/api/timesheet/worklogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.token}`,
        },
        body: JSON.stringify({
          username: settings.username,
          fromDate: formatDateForApi(fromDate),
          toDate: formatDateForApi(toDate),
          jiraInstance: settings.jiraInstance,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `Failed to fetch worklogs: HTTP ${response.status}`
        );
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // Deduplicate by id + issueId
        const seen = new Set<string>();
        const unique = result.data.filter((entry: WorklogEntry) => {
          const key = getWorklogKey(entry);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Sort by date descending
        unique.sort((a: WorklogEntry, b: WorklogEntry) => {
          const dateA = a.startDateEdit || a.startDate;
          const dateB = b.startDateEdit || b.startDate;
          return dateB.localeCompare(dateA);
        });

        setWorklogs(unique);
        setSelectedIds(new Set());
        toast.success(`Found ${unique.length} worklog entries`);
      } else {
        setWorklogs([]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch worklogs';
      setError(message);
      toast.error(message);
      setWorklogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, fromDate, toDate, settings]);

  // Auto-search on mount when configured
  useEffect(() => {
    if (isLoaded && isConfigured) {
      handleSearch();
    }
  }, [isLoaded, isConfigured]);

  const handleDelete = useCallback(
    async (worklogId: number, issueId: number) => {
      if (!isConfigured) {
        toast.error('Jira settings not configured.');
        return;
      }

      const worklog = worklogs.find(
        w => w.id === worklogId && w.issueId === issueId
      );
      if (worklog?.statusWorklog?.toLowerCase() === 'approved') {
        toast.error('Cannot delete an approved worklog.');
        return;
      }

      const key = `${worklogId}_${issueId}`;
      setDeletingId(key);

      try {
        const response = await fetch('/api/timesheet/worklogs/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.token}`,
          },
          body: JSON.stringify({
            issueId,
            timesheetId: worklogId,
            jiraInstance: settings.jiraInstance,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `Failed to delete worklog: HTTP ${response.status}`
          );
        }

        setWorklogs(prev =>
          prev.filter(
            w => !(w.id === worklogId && w.issueId === issueId)
          )
        );
        toast.success('Worklog deleted successfully');
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to delete worklog';
        toast.error(message);
      } finally {
        setDeletingId(null);
      }
    },
    [isConfigured, settings, worklogs]
  );

  const handleBulkDelete = useCallback(async () => {
    if (!isConfigured || selectedIds.size === 0) return;

    setIsBulkDeleting(true);
    setBulkDeleteProgress(0);

    const allSelectedWorklogs = worklogs.filter(w =>
      selectedIds.has(getWorklogKey(w))
    );
    const approvedCount = allSelectedWorklogs.filter(
      w => w.statusWorklog?.toLowerCase() === 'approved'
    ).length;
    const selected = allSelectedWorklogs.filter(
      w => w.statusWorklog?.toLowerCase() !== 'approved'
    );

    if (approvedCount > 0) {
      toast.warning(
        `${approvedCount} approved worklog${approvedCount !== 1 ? 's' : ''} skipped — approved worklogs cannot be deleted.`
      );
    }

    if (selected.length === 0) {
      setIsBulkDeleting(false);
      return;
    }

    const total = selected.length;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selected.length; i++) {
      const worklog = selected[i];
      const key = getWorklogKey(worklog);
      setDeletingId(key);
      setBulkDeleteProgress(Math.round(((i + 1) / total) * 100));

      try {
        const response = await fetch('/api/timesheet/worklogs/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.token}`,
          },
          body: JSON.stringify({
            issueId: worklog.issueId,
            timesheetId: worklog.id,
            jiraInstance: settings.jiraInstance,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `Failed to delete worklog: HTTP ${response.status}`
          );
        }

        setWorklogs(prev =>
          prev.filter(
            w =>
              !(w.id === worklog.id && w.issueId === worklog.issueId)
          )
        );
        successCount++;
      } catch {
        failCount++;
      }

      if (i < selected.length - 1) {
        await delay(REQUEST_DELAY_MS);
      }
    }

    setDeletingId(null);
    setSelectedIds(new Set());
    setIsBulkDeleting(false);
    setBulkDeleteProgress(0);

    if (failCount === 0) {
      toast.success(
        `Deleted ${successCount} worklog(s) successfully`
      );
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${failCount} failed`);
    } else {
      toast.error(`Failed to delete ${failCount} worklog(s)`);
    }
  }, [isConfigured, selectedIds, worklogs, settings]);

  return {
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    worklogs,
    isLoading,
    deletingId,
    error,
    hasSearched,
    totalHours,
    selectedIds,
    allSelected,
    someSelected,
    isBulkDeleting,
    bulkDeleteProgress,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
    handleSearch,
    handleDelete,
    handleBulkDelete,
  };
}
