import { useCallback, useEffect, useRef, useState } from 'react';

import { COPY_FEEDBACK_DURATION } from '@/lib/constants';

/**
 * Hook for clipboard copy with visual feedback.
 *
 * Supports both single-item copy (copiedId is `true`) and multi-item copy
 * (copiedId is the string identifier passed to `copy`).
 */
export function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | true | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setCopiedId(null);
  }, []);

  const copy = useCallback(async (text: string, id?: string) => {
    await navigator.clipboard.writeText(text);

    // Clear any existing timeout before setting a new one
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setCopiedId(id ?? true);

    timeoutRef.current = setTimeout(() => {
      setCopiedId(null);
      timeoutRef.current = null;
    }, COPY_FEEDBACK_DURATION);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { copiedId, copy, reset };
}
