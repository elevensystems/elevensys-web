'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';

import { formatDateForApi, getMonthEnd, getMonthStart } from '@/lib/timesheet';
import type {
  JiraProject,
  ProjectWorklogRow,
  ProjectWorklogsData,
  TimesheetSettings,
} from '@/types/timesheet';

interface UseProjectWorklogsParams {
  settings: TimesheetSettings;
  isConfigured: boolean;
}

interface CommittedFilters {
  pid: number;
  pkey: string;
  startDate: string;
  endDate: string;
  username: string;
  typeOfWork: string;
  filStatus: string;
  desc: boolean;
}

export function useProjectWorklogs({
  settings,
  isConfigured,
}: UseProjectWorklogsParams) {
  // Projects list
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Filter form state
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(
    null
  );
  const [username, setUsername] = useState('');
  const [typeOfWork, setTypeOfWork] = useState('All');
  const [filStatus, setFilStatus] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState(getMonthStart());
  const [toDate, setToDate] = useState(getMonthEnd());
  const [desc, setDesc] = useState(false);

  // Results state
  const [rows, setRows] = useState<ProjectWorklogRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageStart, setPageStart] = useState(0);
  const [pageEnd, setPageEnd] = useState(0);

  // Store last committed filters for pagination
  const lastFiltersRef = useRef<CommittedFilters | null>(null);

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
      if (!response.ok) return;
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setProjects(data.data as JiraProject[]);
      }
    } catch {
      // Silently fail — project list is non-critical
    } finally {
      setProjectsLoading(false);
    }
  }, [isConfigured, settings.jiraInstance, settings.token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const fetchPage = useCallback(
    async (filters: CommittedFilters, page: number) => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch('/api/timesheet/project-worklogs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.token}`,
          },
          body: JSON.stringify({
            pid: filters.pid,
            pkey: filters.pkey,
            startDate: filters.startDate,
            endDate: filters.endDate,
            username: filters.username,
            typeOfWork: filters.typeOfWork,
            filStatus: filters.filStatus,
            filConflict: '',
            components: '',
            products: '',
            jiraInstance: settings.jiraInstance,
            page,
            desc: filters.desc,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || `Failed to fetch: HTTP ${response.status}`
          );
        }

        const result = await response.json();

        if (result.success && result.data) {
          const data = result.data as ProjectWorklogsData;
          setRows(data.rows ?? []);
          setCurrentPage(data.page);
          setTotalPages(data.total);
          setTotalRecords(data.records);
          setPageStart(data.start);
          setPageEnd(data.end);
          toast.success(`Loaded ${data.rows?.length ?? 0} entries`);
        } else {
          setRows([]);
          setTotalPages(0);
          setTotalRecords(0);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to fetch project worklogs';
        setError(message);
        toast.error(message);
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    },
    [settings.token, settings.jiraInstance]
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
      pid: parseInt(selectedProject.id, 10),
      pkey: selectedProject.key,
      startDate: formatDateForApi(fromDate),
      endDate: formatDateForApi(toDate),
      username,
      typeOfWork: typeOfWork === 'All' ? '' : typeOfWork,
      filStatus: filStatus.join(','),
      desc,
    };

    lastFiltersRef.current = filters;
    await fetchPage(filters, 1);
  }, [
    isConfigured,
    selectedProject,
    fromDate,
    toDate,
    username,
    typeOfWork,
    filStatus,
    desc,
    fetchPage,
  ]);

  const goToPage = useCallback(
    async (page: number) => {
      if (!lastFiltersRef.current) return;
      await fetchPage(lastFiltersRef.current, page);
    },
    [fetchPage]
  );

  return {
    // Projects list
    projects,
    projectsLoading,
    // Filter form
    selectedProject,
    setSelectedProject,
    username,
    setUsername,
    typeOfWork,
    setTypeOfWork,
    filStatus,
    setFilStatus,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    desc,
    setDesc,
    // Results
    rows,
    isLoading,
    error,
    hasSearched,
    // Pagination
    currentPage,
    totalPages,
    totalRecords,
    pageStart,
    pageEnd,
    // Actions
    handleSearch,
    goToPage,
  };
}
