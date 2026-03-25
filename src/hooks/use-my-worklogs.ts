'use client';

import { useCallback, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  REQUEST_DELAY_MS,
  delay,
  formatDateForApi,
  getMonthEnd,
  getMonthStart,
} from '@/lib/timesheet';
import type {
  MyWorklogsRow,
  TimesheetSettings,
  UpdateWorklogRequest,
} from '@/types/timesheet';

import { getWorklogKey } from './use-worklogs';

const SELECTABLE_STATUSES = ['pending', 'rejected', 'reopened'];

interface UseMyWorklogsParams {
  settings: TimesheetSettings;
  isConfigured: boolean;
}

export function useMyWorklogs({ settings, isConfigured }: UseMyWorklogsParams) {
  // Filter form state
  const [statusWorklog, setStatusWorklog] = useState('All');
  const [fromDate, setFromDate] = useState(getMonthStart());
  const [toDate, setToDate] = useState(getMonthEnd());

  // Results state
  const [worklogs, setWorklogs] = useState<MyWorklogsRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Edit state
  const [editingWorklog, setEditingWorklog] = useState<MyWorklogsRow | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);

  const selectableWorklogs = useMemo(
    () =>
      worklogs.filter(w =>
        SELECTABLE_STATUSES.includes(w.statusWorklog?.toLowerCase() ?? '')
      ),
    [worklogs]
  );

  const allSelected =
    selectableWorklogs.length > 0 &&
    selectedIds.size === selectableWorklogs.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < selectableWorklogs.length;

  const totalHours = useMemo(
    () => worklogs.reduce((sum, w) => sum + (Number(w.worked) || 0), 0),
    [worklogs]
  );

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableWorklogs.map(getWorklogKey)));
    }
  }, [allSelected, selectableWorklogs]);

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
      setError('Please configure your Jira settings first.');
      return;
    }
    if (!settings.username) {
      setError('Username is required. Please update your Jira settings.');
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
    setHasSearched(true);
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        username: settings.username,
        fromDate: formatDateForApi(fromDate),
        toDate: formatDateForApi(toDate),
        statusWorklog,
        jiraInstance: settings.jiraInstance,
      });

      const response = await fetch(
        `/api/timesheet/worklogs?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${settings.token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch: HTTP ${response.status}`
        );
      }

      const data = await response.json();

      // Handle both raw array and object with rows property
      const rows: MyWorklogsRow[] = Array.isArray(data)
        ? data
        : (data.rows ?? data.data ?? []);

      setWorklogs(rows);
      setSelectedIds(new Set());
      toast.success(`Loaded ${rows.length} entries`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch worklogs';
      setError(message);
      toast.error(message);
      setWorklogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, settings, fromDate, toDate, statusWorklog]);

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
        const params = new URLSearchParams({
          jiraInstance: settings.jiraInstance,
        });

        const response = await fetch(
          `/api/timesheet/worklogs/${issueId}/${worklogId}?${params.toString()}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${settings.token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `Failed to delete worklog: HTTP ${response.status}`
          );
        }

        setWorklogs(prev =>
          prev.filter(w => !(w.id === worklogId && w.issueId === issueId))
        );
        toast.success('Worklog deleted successfully');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete worklog';
        toast.error(message);
      } finally {
        setDeletingId(null);
      }
    },
    [isConfigured, settings, worklogs]
  );

  const openEditModal = useCallback((worklog: MyWorklogsRow) => {
    setEditingWorklog(worklog);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditingWorklog(null);
  }, []);

  const handleEdit = useCallback(
    async (
      worklog: MyWorklogsRow,
      changes: Omit<UpdateWorklogRequest, 'id' | 'jiraInstance'>
    ) => {
      if (!isConfigured) {
        toast.error('Jira settings not configured.');
        return;
      }

      if (Object.keys(changes).length === 0) {
        toast.info('No changes to save.');
        return;
      }

      setIsEditing(true);

      try {
        const payload: UpdateWorklogRequest = {
          id: worklog.id,
          jiraInstance: settings.jiraInstance,
          ...changes,
        };

        const response = await fetch(
          `/api/timesheet/worklogs/${worklog.issueId}/${worklog.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${settings.token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `Failed to update worklog: HTTP ${response.status}`
          );
        }

        setWorklogs(prev =>
          prev.map(w =>
            w.id === worklog.id && w.issueId === worklog.issueId
              ? {
                  ...w,
                  ...(changes.description !== undefined && {
                    description: changes.description,
                  }),
                  ...(changes.worked !== undefined && {
                    worked: changes.worked,
                  }),
                  ...(changes.typeOfWork !== undefined && {
                    typeOfWork: changes.typeOfWork,
                  }),
                  ...(changes.startDateEdit !== undefined && {
                    startDateEdit: changes.startDateEdit,
                  }),
                }
              : w
          )
        );

        setEditingWorklog(null);
        toast.success('Worklog updated successfully');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update worklog';
        toast.error(message);
      } finally {
        setIsEditing(false);
      }
    },
    [isConfigured, settings]
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
        const deleteParams = new URLSearchParams({
          jiraInstance: settings.jiraInstance,
        });

        const response = await fetch(
          `/api/timesheet/worklogs/${worklog.issueId}/${worklog.id}?${deleteParams.toString()}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${settings.token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `Failed to delete worklog: HTTP ${response.status}`
          );
        }

        setWorklogs(prev =>
          prev.filter(
            w => !(w.id === worklog.id && w.issueId === worklog.issueId)
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
      toast.success(`Deleted ${successCount} worklog(s) successfully`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${failCount} failed`);
    } else {
      toast.error(`Failed to delete ${failCount} worklog(s)`);
    }
  }, [isConfigured, selectedIds, worklogs, settings]);

  return {
    // Filter form
    statusWorklog,
    setStatusWorklog,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    // Results
    worklogs,
    isLoading,
    deletingId,
    error,
    hasSearched,
    totalHours,
    // Selection
    selectedIds,
    allSelected,
    someSelected,
    isBulkDeleting,
    bulkDeleteProgress,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
    // Edit
    editingWorklog,
    isEditing,
    openEditModal,
    closeEditModal,
    handleEdit,
    // Actions
    handleSearch,
    handleDelete,
    handleBulkDelete,
  };
}
