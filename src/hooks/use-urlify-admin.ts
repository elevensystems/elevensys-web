'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import type { ShortenedUrl } from '@/types/urlify';

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
const REQUEST_DELAY_MS = 500;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export function useUrlifyAdmin() {
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageSize, setPageSizeState] =
    useState<PageSizeOption>(DEFAULT_PAGE_SIZE);

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

  const fetchPage = useCallback(
    async (cursor?: string, size: number = pageSize) => {
      setIsLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({ limit: String(size) });
        if (cursor) params.set('lastKey', cursor);

        const response = await fetch(`/api/admin/urlify?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch URLs: HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.data) {
          const fetchedUrls: ShortenedUrl[] = result.data.urls ?? [];

          // If the page is empty and we're not on the first page,
          // go back to the previous page instead of showing an empty state.
          if (fetchedUrls.length === 0 && cursor) {
            setNextCursor(null);
            setCurrentPageIndex(prev => {
              const newIndex = Math.max(0, prev - 1);
              setCursorStack(stack => stack.slice(0, newIndex));
              return newIndex;
            });
            toast.info('No more data — returned to the last page.');
            return;
          }

          setUrls(fetchedUrls);
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
    },
    [pageSize]
  );

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

  const goToPage = useCallback(
    (targetIndex: number) => {
      if (targetIndex === currentPageIndex) return;
      if (targetIndex < 0) return;

      // Navigate to first page
      if (targetIndex === 0) {
        setCursorStack([]);
        setCurrentPageIndex(0);
        fetchPage(undefined);
        return;
      }

      // Navigate to a previously-visited page
      if (targetIndex <= cursorStack.length) {
        const cursor = cursorStack[targetIndex - 1];
        setCursorStack(prev => prev.slice(0, targetIndex));
        setCurrentPageIndex(targetIndex);
        fetchPage(cursor);
        return;
      }

      // Navigate to the next undiscovered page (one beyond cursor stack)
      if (targetIndex === cursorStack.length + 1 && nextCursor) {
        goToNextPage();
      }
    },
    [currentPageIndex, cursorStack, fetchPage, nextCursor, goToNextPage]
  );

  // Total number of pages we know about
  // cursorStack.length = pages visited beyond page 0
  // +1 for page 0 itself
  // +1 if there's a next cursor (unseen next page)
  const totalPages = cursorStack.length + 1 + (hasNextPage ? 1 : 0);

  const setPageSize = useCallback(
    (newSize: PageSizeOption) => {
      setPageSizeState(newSize);
      setCursorStack([]);
      setCurrentPageIndex(0);
      setNextCursor(null);
      fetchPage(undefined, newSize);
    },
    [fetchPage]
  );

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
    goToPage,
    pageIndex: currentPageIndex,
    totalPages,
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
    pageSize,
    setPageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  };
}
