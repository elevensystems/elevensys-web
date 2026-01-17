import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};
