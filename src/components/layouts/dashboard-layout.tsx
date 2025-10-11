import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Dashboard layout for authenticated users
 * Includes sidebar navigation and user menu
 */
export default function DashboardLayout({
  children,
  className = '',
}: DashboardLayoutProps) {
  return (
    <div className='min-h-screen flex bg-background'>
      {/* Sidebar */}
      <aside className='w-64 border-r border-border flex flex-col'>
        <div className='p-4 border-b border-border'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 bg-foreground rounded-md flex items-center justify-center'>
              <span className='text-background font-bold text-sm'>URL</span>
            </div>
            <span className='font-semibold text-lg'>Dashboard</span>
          </div>
        </div>

        <nav className='flex-1 p-4'>
          <ul className='space-y-2'>
            <li>
              <Button variant='ghost' className='w-full justify-start'>
                Dashboard
              </Button>
            </li>
            <li>
              <Button variant='ghost' className='w-full justify-start'>
                My Links
              </Button>
            </li>
            <li>
              <Button variant='ghost' className='w-full justify-start'>
                Analytics
              </Button>
            </li>
            <li>
              <Button variant='ghost' className='w-full justify-start'>
                Settings
              </Button>
            </li>
          </ul>
        </nav>

        <div className='p-4 border-t border-border'>
          <Button variant='outline' className='w-full'>
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        <header className='h-16 border-b border-border flex items-center justify-between px-6'>
          <h2 className='text-xl font-semibold'>Welcome back!</h2>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-muted rounded-full flex items-center justify-center'>
              <span className='text-sm font-medium'>JD</span>
            </div>
          </div>
        </header>
        <main className={`flex-1 p-6 ${className}`}>{children}</main>
      </div>
    </div>
  );
}
