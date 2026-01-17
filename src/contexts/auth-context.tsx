'use client';

import { ReactNode, createContext, useContext } from 'react';

type AuthUser = {
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'free' | 'pro';
  groups: string[];
} | null;

type AuthContextType = {
  user: AuthUser;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: AuthUser;
}) {
  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
