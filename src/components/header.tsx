import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className='border-b border-border'>
      <div className='container mx-auto px-4 h-16 flex items-center justify-between'>
        <Link href='/' className='flex items-center gap-2'>
          <div className='w-full h-8 bg-foreground rounded-md flex items-center justify-center'>
            <span className='text-background font-bold text-md px-2'>
              Eleven
            </span>
          </div>
          <span className='font-semibold text-lg'>Systems</span>
        </Link>

        <div className='flex items-center gap-4'>
          <Link href='/login'>
            <Button variant='ghost' className='font-medium'>
              Sign In
            </Button>
          </Link>
          <Link href='/signup'>
            <Button className='font-medium shadow-sm'>Sign Up</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
