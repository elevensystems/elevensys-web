import { redirect } from 'next/navigation';

import { getUserFromSession } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromSession();

  if (!user) redirect('/login');
  if (user.role !== 'admin') redirect('/');

  return <>{children}</>;
}
