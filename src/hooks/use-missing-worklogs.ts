'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { formatDateForApi, getMonthEnd, getMonthStart } from '@/lib/timesheet';
import type {
  JiraIssue,
  JiraProject,
  TimesheetSettings,
  WorkType,
  WorklogsWarningEntry,
} from '@/types/timesheet';
import { WORK_TYPES } from '@/types/timesheet';

interface UseMissingWorklogsParams {
  settings: TimesheetSettings;
  isConfigured: boolean;
}

export function useMissingWorklogs({
  settings,
  isConfigured,
}: UseMissingWorklogsParams) {
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [warningFromDate, setWarningFromDate] = useState(getMonthStart());
  const [warningToDate, setWarningToDate] = useState(getMonthEnd());
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isSearchingWarnings, setIsSearchingWarnings] = useState(false);

  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);

  // Fetch projects on mount when configured
  useEffect(() => {
    if (!isConfigured) return;

    const controller = new AbortController();
    setIsLoadingProjects(true);

    fetch(`/api/timesheet/projects?jiraInstance=${settings.jiraInstance}`, {
      headers: { Authorization: `Bearer ${settings.token}` },
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setProjects(result.data);
        } else {
          toast.error(result.error || 'Failed to fetch projects');
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          toast.error('Failed to fetch projects');
        }
      })
      .finally(() => setIsLoadingProjects(false));

    return () => controller.abort();
  }, [isConfigured, settings.jiraInstance, settings.token]);

  // Fetch issues when a project is selected
  useEffect(() => {
    if (!isConfigured || !selectedProjectId) {
      setIssues([]);
      return;
    }

    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return;

    const controller = new AbortController();
    setIsLoadingIssues(true);

    fetch('/api/timesheet/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.token}`,
      },
      body: JSON.stringify({
        jiraInstance: settings.jiraInstance,
        jql: `project = ${selectedProjectId} ORDER BY created DESC`,
        columnConfig: 'explicit',
        layoutKey: 'split-view',
        startIndex: '0',
      }),
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data?.issues)) {
          setIssues(result.data.issues);
        } else {
          setIssues([]);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setIssues([]);
        }
      })
      .finally(() => setIsLoadingIssues(false));

    return () => controller.abort();
  }, [
    isConfigured,
    selectedProjectId,
    projects,
    settings.jiraInstance,
    settings.token,
  ]);

  const handleSearchWarnings = useCallback(async (): Promise<{
    dates: string;
    count: number;
  } | null> => {
    if (!selectedProjectId) {
      toast.error('Please select a project.');
      return null;
    }
    if (!warningFromDate || !warningToDate) {
      toast.error('Please select a date range.');
      return null;
    }

    setIsSearchingWarnings(true);
    try {
      const response = await fetch('/api/timesheet/worklogs-warning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.token}`,
        },
        body: JSON.stringify({
          pid: selectedProjectId,
          startDate: formatDateForApi(warningFromDate),
          endDate: formatDateForApi(warningToDate),
          jiraInstance: settings.jiraInstance,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const allDates = result.data
          .map((entry: WorklogsWarningEntry) => entry.value)
          .filter(Boolean)
          .join(', ');
        if (allDates) {
          return {
            dates: allDates,
            count: result.data.length,
          };
        }
        toast.info('No missing worklog dates found.');
        return null;
      }
      toast.info('No missing worklog dates found.');
      return null;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to search warnings';
      toast.error(message);
      return null;
    } finally {
      setIsSearchingWarnings(false);
    }
  }, [
    selectedProjectId,
    warningFromDate,
    warningToDate,
    settings.jiraInstance,
    settings.token,
  ]);

  const fetchIssueTypeOfWork = useCallback(
    async (issueId: number): Promise<WorkType | null> => {
      // Check cache first
      const cached = issues.find(i => i.id === issueId);
      if (cached?.typeOfWork) {
        return (WORK_TYPES as readonly string[]).includes(cached.typeOfWork)
          ? (cached.typeOfWork as WorkType)
          : null;
      }

      try {
        const response = await fetch(`/api/timesheet/issue/${issueId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.token}`,
          },
          body: JSON.stringify({ jiraInstance: settings.jiraInstance }),
        });

        if (!response.ok) return null;

        const result = await response.json();
        const typeOfWork = result?.data?.fields?.customfield_10400 as
          | string
          | null;

        if (
          typeOfWork &&
          (WORK_TYPES as readonly string[]).includes(typeOfWork)
        ) {
          // Cache the value on the issue object
          setIssues(prev =>
            prev.map(i => (i.id === issueId ? { ...i, typeOfWork } : i))
          );
          return typeOfWork as WorkType;
        }

        return null;
      } catch {
        return null;
      }
    },
    [issues, settings.token, settings.jiraInstance]
  );

  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const issuesByKey = useMemo(
    () => new Map(issues.map(i => [i.key, i])),
    [issues]
  );

  return {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    issues,
    issuesByKey,
    isLoadingProjects,
    isLoadingIssues,
    warningFromDate,
    setWarningFromDate,
    warningToDate,
    setWarningToDate,
    isSearchingWarnings,
    handleSearchWarnings,
    fetchIssueTypeOfWork,
  };
}
