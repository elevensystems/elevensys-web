'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import type { ShortenedUrl } from '@/types/urlify';

const PAGE_SIZE = 5;
const REQUEST_DELAY_MS = 500;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function useUrlifyAdmin() {
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Cursor-based pagination
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Deletion
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);

  const allSelected = urls.length > 0 && selectedIds.size === urls.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < urls.length;

  const hasNextPage = nextCursor !== null;
  const hasPrevPage = currentPageIndex > 0;

  const fetchPage = useCallback(async (cursor?: string) => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (cursor) params.set('lastKey', cursor);

      const response = await fetch(`/api/admin/urlify?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch URLs: HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.data) {
        setUrls(result.data.urls ?? []);
        setNextCursor(
          result.data.lastEvaluatedKey
            ? JSON.stringify(result.data.lastEvaluatedKey)
            : null
        );
        setSelectedIds(new Set());
      } else {
        setUrls([]);
        setNextCursor(null);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch URLs';
      setError(message);
      toast.error(message);
      setUrls([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const goToNextPage = useCallback(() => {
    if (!nextCursor) return;
    setCursorStack(prev => [...prev, nextCursor]);
    setCurrentPageIndex(prev => prev + 1);
    fetchPage(nextCursor);
  }, [nextCursor, fetchPage]);

  const goToPrevPage = useCallback(() => {
    if (currentPageIndex <= 0) return;
    const newStack = cursorStack.slice(0, -1);
    setCursorStack(newStack);
    setCurrentPageIndex(prev => prev - 1);
    const prevCursor =
      newStack.length > 0 ? newStack[newStack.length - 1] : undefined;
    fetchPage(prevCursor);
  }, [currentPageIndex, cursorStack, fetchPage]);

  const refresh = useCallback(() => {
    const currentCursor =
      currentPageIndex > 0 ? cursorStack[currentPageIndex - 1] : undefined;
    fetchPage(currentCursor);
  }, [currentPageIndex, cursorStack, fetchPage]);

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(urls.map(u => u.shortCode)));
    }
  }, [allSelected, urls]);

  const toggleSelect = useCallback((shortCode: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(shortCode)) {
        next.delete(shortCode);
      } else {
        next.add(shortCode);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDelete = useCallback(async (shortCode: string) => {
    setDeletingId(shortCode);

    try {
      const response = await fetch(`/api/admin/urlify/${shortCode}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete URL: HTTP ${response.status}`);
      }

      setUrls(prev => prev.filter(u => u.shortCode !== shortCode));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(shortCode);
        return next;
      });
      toast.success('URL deleted successfully');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete URL';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setIsBulkDeleting(true);
    setBulkDeleteProgress(0);

    const selected = urls.filter(u => selectedIds.has(u.shortCode));
    const total = selected.length;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selected.length; i++) {
      const url = selected[i];
      setDeletingId(url.shortCode);
      setBulkDeleteProgress(Math.round(((i + 1) / total) * 100));

      try {
        const response = await fetch(`/api/admin/urlify/${url.shortCode}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to delete URL: HTTP ${response.status}`);
        }

        setUrls(prev => prev.filter(u => u.shortCode !== url.shortCode));
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
      toast.success(`Deleted ${successCount} URL(s) successfully`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${failCount} failed`);
    } else {
      toast.error(`Failed to delete ${failCount} URL(s)`);
    }
  }, [selectedIds, urls]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return {
    urls,
    isLoading,
    error,
    hasNextPage,
    hasPrevPage,
    goToNextPage,
    goToPrevPage,
    pageIndex: currentPageIndex,
    selectedIds,
    allSelected,
    someSelected,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
    deletingId,
    isBulkDeleting,
    bulkDeleteProgress,
    handleDelete,
    handleBulkDelete,
    refresh,
  };
}
