import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className='border-b border-border'>
      <div className='container mx-auto px-4 h-16 flex items-center justify-between'>
        <Link href='/' className='flex items-center gap-2'>
          <div className='w-8 h-8 bg-foreground rounded-md flex items-center justify-center'>
            <span className='text-background font-bold text-sm'>URL</span>
          </div>
          <span className='font-semibold text-lg'>Demo</span>
        </Link>

        <div className='flex items-center gap-3'>
          <Button variant='ghost'>Sign In</Button>
          <Button>Sign Up</Button>
        </div>
      </div>
    </header>
  );
}
