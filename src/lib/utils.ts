import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { AuthUser, UserRole } from '@/types/auth';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

export const hasRole = (
  user: AuthUser | null | undefined,
  roles: UserRole[]
): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return roles.includes(user.role);
};
