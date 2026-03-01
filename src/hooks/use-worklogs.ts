'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { toast } from 'sonner';

import {
  REQUEST_DELAY_MS,
  delay,
  formatDateForApi,
  getMonthEnd,
  getMonthStart,
} from '@/lib/timesheet';
import type {
  JiraProject,
  MyWorklogsData,
  MyWorklogsRow,
  TimesheetSettings,
  WorklogEntry,
} from '@/types/timesheet';

export function getWorklogKey(worklog: WorklogEntry | MyWorklogsRow): string {
  return `${worklog.id}_${worklog.issueId}`;
}

interface UseWorklogsParams {
  settings: TimesheetSettings;
  isConfigured: boolean;
}

interface CommittedFilters {
  projectKey: string;
  fromDate: string;
  toDate: string;
  statusWorklog: string;
  jiraInstance: string;
}

export function useWorklogs({ settings, isConfigured }: UseWorklogsParams) {
  // Projects list
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Filter form state
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(
    null
  );
  const [statusWorklog, setStatusWorklog] = useState('All');
  const [fromDate, setFromDate] = useState(getMonthStart());
  const [toDate, setToDate] = useState(getMonthEnd());

  // Results state
  const [worklogs, setWorklogs] = useState<MyWorklogsRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageStart, setPageStart] = useState(0);
  const [pageEnd, setPageEnd] = useState(0);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);

  // Store last committed filters for pagination
  const lastFiltersRef = useRef<CommittedFilters | null>(null);

  const allSelected =
    worklogs.length > 0 && selectedIds.size === worklogs.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < worklogs.length;

  const totalHours = useMemo(
    () => worklogs.reduce((sum, w) => sum + (Number(w.worked) || 0), 0),
    [worklogs]
  );

  // Fetch projects list
  const fetchProjects = useCallback(async () => {
    if (!isConfigured) return;
    setProjectsLoading(true);
    try {
      const response = await fetch(
        `/api/timesheet/projects?jiraInstance=${settings.jiraInstance}`,
        {
          headers: { Authorization: `Bearer ${settings.token}` },
        }
      );
      if (!response.ok) {
        toast.error('Failed to fetch projects');
        return;
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setProjects(data.data as JiraProject[]);
      } else {
        toast.error(data.error || 'Failed to fetch projects');
      }
    } catch {
      toast.error('Failed to fetch projects');
    } finally {
      setProjectsLoading(false);
    }
  }, [isConfigured, settings.jiraInstance, settings.token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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

  const fetchPage = useCallback(
    async (filters: CommittedFilters, page: number) => {
      setIsLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          projectKey: filters.projectKey,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          statusWorklog: filters.statusWorklog,
          page: String(page),
          jiraInstance: filters.jiraInstance,
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

        const result = await response.json();

        if (result.success && result.data) {
          const data = result.data as MyWorklogsData;
          setWorklogs(data.rows ?? []);
          setCurrentPage(page);
          const pages =
            data.pageSize > 0 ? Math.ceil(data.records / data.pageSize) : 0;
          setTotalPages(pages);
          setTotalRecords(data.records);
          setPageStart(data.start);
          setPageEnd(data.end);
          setSelectedIds(new Set());
          toast.success(`Loaded ${data.rows?.length ?? 0} entries`);
        } else {
          setWorklogs([]);
          setTotalPages(0);
          setTotalRecords(0);
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
    },
    [settings.token]
  );

  const handleSearch = useCallback(async () => {
    if (!isConfigured) {
      setError('Please configure your Jira settings first.');
      return;
    }
    if (!selectedProject) {
      setError('Please select a project.');
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

    const filters: CommittedFilters = {
      projectKey: selectedProject.key,
      fromDate: formatDateForApi(fromDate),
      toDate: formatDateForApi(toDate),
      statusWorklog,
      jiraInstance: settings.jiraInstance,
    };

    lastFiltersRef.current = filters;
    await fetchPage(filters, 1);
  }, [
    isConfigured,
    selectedProject,
    fromDate,
    toDate,
    statusWorklog,
    settings.jiraInstance,
    fetchPage,
  ]);

  const goToPage = useCallback(
    async (page: number) => {
      if (!lastFiltersRef.current) return;
      await fetchPage(lastFiltersRef.current, page);
    },
    [fetchPage]
  );

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
    // Projects list
    projects,
    projectsLoading,
    // Filter form
    selectedProject,
    setSelectedProject,
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
    // Pagination
    currentPage,
    totalPages,
    totalRecords,
    pageStart,
    pageEnd,
    // Selection
    selectedIds,
    allSelected,
    someSelected,
    isBulkDeleting,
    bulkDeleteProgress,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
    // Actions
    handleSearch,
    goToPage,
    handleDelete,
    handleBulkDelete,
  };
}
