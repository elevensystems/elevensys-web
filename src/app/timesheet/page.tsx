'use client';

import Link from 'next/link';

import {
  ArrowRight,
  ClipboardList,
  Clock,
  PenLine,
  Settings,
} from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';

const features = [
  {
    title: 'Log Work',
    description:
      'Submit your work entries to Jira. Add multiple entries with issue keys, type of work, hours, and descriptions — then log them all in bulk.',
    href: '/timesheet/logwork',
    icon: PenLine,
    highlights: [
      'Bulk log multiple entries at once',
      'Date range support for multi-day logging',
      'Real-time progress tracking',
    ],
  },
  {
    title: 'My Worklogs',
    description:
      'View all your logged timesheets from Jira. Search by date range, see approval status, and export to CSV.',
    href: '/timesheet/worklogs',
    icon: ClipboardList,
    highlights: [
      'Search by date range',
      'Approval status tracking',
      'Export worklogs to CSV',
    ],
  },
  {
    title: 'Settings',
    description:
      'Configure your Jira credentials and connection. Your settings are stored securely in your browser.',
    href: '/timesheet/config',
    icon: Settings,
    highlights: [
      'Jira username &  token',
      'Jira instance selection',
      'Stored locally in your browser',
    ],
  },
] as const;

export default function TimesheetPage() {
  const { isConfigured, isLoaded } = useTimesheetSettings();

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-4xl mx-auto'>
          <ToolPageHeader
            title='Timesheet'
            description='Manage your Jira  timesheets. Log work entries and view your logged hours — all in one place.'
          />

          {isLoaded && !isConfigured && (
            <div className='mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-200'>
              <p>
                <strong>Getting started:</strong> Head to{' '}
                <Link
                  href='/timesheet/config'
                  className='font-medium underline underline-offset-4'
                >
                  Settings
                </Link>{' '}
                to configure your Jira username, token, and instance before
                logging work.
              </p>
            </div>
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {features.map(feature => (
              <Card key={feature.title} className='flex flex-col'>
                <CardHeader>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                      <feature.icon className='h-5 w-5' />
                    </div>
                    <CardTitle className='text-lg'>{feature.title}</CardTitle>
                  </div>
                  <CardDescription className='mt-2'>
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex-1'>
                  <ul className='space-y-2'>
                    {feature.highlights.map(highlight => (
                      <li
                        key={highlight}
                        className='flex items-center gap-2 text-sm text-muted-foreground'
                      >
                        <Clock className='h-3.5 w-3.5 shrink-0 text-primary' />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className='w-full'>
                    <Link href={feature.href}>
                      {feature.title}
                      <ArrowRight className='h-4 w-4' />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {isLoaded && isConfigured && (
            <div className='mt-8 text-center'>
              <Badge variant='secondary' className='gap-1.5'>
                <span className='h-2 w-2 rounded-full bg-green-500' />
                Jira settings configured
              </Badge>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
