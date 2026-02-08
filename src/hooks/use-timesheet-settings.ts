'use client';

import { useCallback, useEffect, useState } from 'react';

import { SETTINGS_STORAGE_KEY } from '@/lib/timesheet';
import type { TimesheetSettings } from '@/types/timesheet';

const DEFAULT_SETTINGS: TimesheetSettings = {
  username: '',
  token: '',
  baseUrl: 'https://insight.fsoft.com.vn/jira9',
};

export function useTimesheetSettings() {
  const [settings, setSettings] = useState<TimesheetSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // Ignore parse errors, use defaults
    }
    setIsLoaded(true);
  }, []);

  const saveSettings = useCallback((newSettings: TimesheetSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  }, []);

  const isConfigured = Boolean(
    settings.username && settings.token && settings.baseUrl
  );

  return { settings, saveSettings, isConfigured, isLoaded };
}
