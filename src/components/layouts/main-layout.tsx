import { ReactNode } from 'react';

import Header from '@/components/header';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Main layout for public pages
 * Includes header with navigation and sign in/up buttons
 */
export default function MainLayout({
  children,
  className = '',
}: MainLayoutProps) {
  return (
    <div className='min-h-screen flex flex-col bg-background'>
      <Header />
      <div className='items-center justify-center px-4'>
        <main className={className}>{children}</main>
      </div>
    </div>
  );
}
