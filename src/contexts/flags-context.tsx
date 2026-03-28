'use client';

import { createContext, useContext } from 'react';

type FlagsRecord = Record<string, boolean>;

const FlagsContext = createContext<FlagsRecord>({});

export function FlagsProvider({
  children,
  flags,
}: {
  children: React.ReactNode;
  flags: FlagsRecord;
}) {
  return <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>;
}

export function useFlags() {
  return useContext(FlagsContext);
}

/** Returns true if the flag is enabled or no flagKey is required. */
export function isFlagEnabled(flags: FlagsRecord, flagKey?: string): boolean {
  if (!flagKey) return true;
  return flags[flagKey] === true;
}
