import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layouts/main-layout';
import { getUserFromSession } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromSession();

  if (!user) {
    return (
      <MainLayout>
        <section className='container mx-auto px-4 py-12'>
          <div className='max-w-3xl mx-auto space-y-6'>
            <h1 className='text-3xl font-bold'>Admin</h1>
            <Alert className='border-dashed'>
              <AlertTitle>Sign in required</AlertTitle>
              <AlertDescription>
                Please sign in with an admin account to access this page.
              </AlertDescription>
            </Alert>
            <Button asChild>
              <Link href='/login'>Sign in</Link>
            </Button>
          </div>
        </section>
      </MainLayout>
    );
  }

  if (user.role !== 'admin') {
    return (
      <MainLayout>
        <section className='container mx-auto px-4 py-12'>
          <div className='max-w-3xl mx-auto space-y-6'>
            <h1 className='text-3xl font-bold'>Admin</h1>
            <Alert className='border-dashed'>
              <AlertTitle>Access denied</AlertTitle>
              <AlertDescription>
                You do not have permission to access the admin panel. This area
                is restricted to administrators only.
              </AlertDescription>
            </Alert>
          </div>
        </section>
      </MainLayout>
    );
  }

  return <>{children}</>;
}
