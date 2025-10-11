import Link from 'next/link';

import { MainLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-32 md:py-40'>
        <div className='max-w-4xl mx-auto text-center'>
          <h1 className='text-5xl md:text-6xl font-bold mb-6'>
            Welcome to URL Shortener
          </h1>
          <p className='text-xl text-muted-foreground mb-8'>
            Transform your long URLs into short, shareable links
          </p>
          <Link href='/snip'>
            <Button size='lg'>Get Started</Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
