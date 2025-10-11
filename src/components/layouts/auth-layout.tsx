import { ReactNode } from 'react';

import { GalleryVerticalEnd } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Auth layout for login/signup pages
 * Simple centered layout without navigation
 */
export default function AuthLayout({
  children,
  className = '',
}: AuthLayoutProps) {
  return (
    <div className='bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
      <div className='flex w-full max-w-sm flex-col gap-6'>
        <a href='#' className='flex items-center gap-2 self-center font-medium'>
          <div className='bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md'>
            <GalleryVerticalEnd className='size-4' />
          </div>
          Eleven Systems Inc.
        </a>
        <div className={className}>{children}</div>
      </div>
    </div>
  );
}
