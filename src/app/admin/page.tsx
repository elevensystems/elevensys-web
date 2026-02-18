import { ShieldCheck } from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';
import { getUserFromSession } from '@/lib/auth';

export default async function AdminWelcomePage() {
  const user = await getUserFromSession();

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-24'>
        <div className='max-w-xl mx-auto text-center space-y-4'>
          <div className='flex justify-center'>
            <ShieldCheck className='h-12 w-12 text-primary' />
          </div>
          <h1 className='text-3xl font-bold'>
            Welcome back, {user?.name ?? 'Admin'}
          </h1>
          <p className='text-muted-foreground'>
            You are signed in as an administrator. Use the sidebar to navigate
            the admin panel.
          </p>
        </div>
      </section>
    </MainLayout>
  );
}
