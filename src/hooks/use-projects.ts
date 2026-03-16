'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import type { JiraProject, TimesheetSettings } from '@/types/timesheet';

interface UseProjectsParams {
  settings: TimesheetSettings;
  isConfigured: boolean;
}

export function useProjects({ settings, isConfigured }: UseProjectsParams) {
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProject, setSelectedProjectState] =
    useState<JiraProject | null>(null);

  useEffect(() => {
    if (!isConfigured) return;

    const controller = new AbortController();
    setIsLoading(true);

    (async () => {
      try {
        const response = await fetch(
          `/api/timesheet/projects?jiraInstance=${settings.jiraInstance}`,
          {
            headers: { Authorization: `Bearer ${settings.token}` },
            signal: controller.signal,
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
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          toast.error('Failed to fetch projects');
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [isConfigured, settings.jiraInstance, settings.token]);

  const setSelectedProject = useCallback((project: JiraProject | null) => {
    setSelectedProjectState(project);
  }, []);

  return {
    projects,
    isLoading,
    selectedProject,
    setSelectedProject,
  };
}
