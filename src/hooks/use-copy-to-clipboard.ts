'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { COPY_FEEDBACK_DURATION } from '@/lib/constants';

interface UseCopyToClipboardOptions {
  /** Duration in ms to show the copied feedback (default: COPY_FEEDBACK_DURATION) */
  feedbackDuration?: number;
  /** Callback fired after successful copy */
  onCopy?: () => void;
  /** Callback fired on copy error */
  onError?: (error: Error) => void;
}

interface UseCopyToClipboardReturn {
  /** Whether the text was recently copied */
  copied: boolean;
  /** Copy text to clipboard */
  copy: (text: string) => Promise<void>;
  /** Reset the copied state */
  reset: () => void;
}

/**
 * Hook for copying text to clipboard with feedback state
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn {
  const {
    feedbackDuration = COPY_FEEDBACK_DURATION,
    onCopy,
    onError,
  } = options;

  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    setCopied(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onCopy?.();

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setCopied(false);
          timeoutRef.current = null;
        }, feedbackDuration);
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Failed to copy');
        console.error('Failed to copy to clipboard:', err);
        onError?.(err);
      }
    },
    [feedbackDuration, onCopy, onError]
  );

  return { copied, copy, reset };
}
