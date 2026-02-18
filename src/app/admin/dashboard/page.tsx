'use client';

import { Settings, Shield, Users } from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

const PLACEHOLDER_CARDS = [
  {
    title: 'User Management',
    description: 'View and manage users, assign roles, and control access.',
    icon: Users,
  },
  {
    title: 'Security',
    description: 'Monitor authentication events and manage security settings.',
    icon: Shield,
  },
  {
    title: 'Settings',
    description: 'Configure application settings and system preferences.',
    icon: Settings,
  },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto'>
          <ToolPageHeader
            title='Admin Dashboard'
            description={`Welcome back, ${user?.name ?? 'Admin'}.`}
          />

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {PLACEHOLDER_CARDS.map(card => (
              <Card
                key={card.title}
                className='opacity-60 cursor-not-allowed'
              >
                <CardHeader>
                  <div className='flex items-center gap-3'>
                    <card.icon className='h-5 w-5 text-muted-foreground' />
                    <CardTitle className='text-lg'>{card.title}</CardTitle>
                  </div>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <p className='text-sm text-muted-foreground mt-8 text-center'>
            More admin features coming soon.
          </p>
        </div>
      </section>
    </MainLayout>
  );
}
