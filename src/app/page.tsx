'use client';

import Link from 'next/link';

import {
  ArrowRight,
  Braces,
  ClipboardList,
  Clock,
  FileText,
  Key,
  Link2,
  PenLine,
  Settings,
  Sparkles,
  Wrench,
} from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';
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
import { Separator } from '@/components/ui/separator';
import { ShineBorder } from '@/components/ui/shine-border';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';

const timesheetActions = [
  {
    title: 'Log Work',
    description:
      'Submit bulk work entries to Jira with date ranges and real-time progress.',
    href: '/timesheet/logwork',
    icon: PenLine,
    primary: true,
  },
  {
    title: 'My Worklogs',
    description: 'View logged hours, check approval status, and export to CSV.',
    href: '/timesheet/worklogs',
    icon: ClipboardList,
    primary: false,
  },
  {
    title: 'Settings',
    description: 'Configure your Jira credentials and instance connection.',
    href: '/timesheet/config',
    icon: Settings,
    primary: false,
  },
] as const;

const quickTools = [
  { name: 'Urlify', href: '/tools/urlify', icon: Link2 },
  { name: 'JSON Diffinity', href: '/tools/json-diffinity', icon: Braces },
  { name: 'JSON Objectify', href: '/tools/json-objectify', icon: Sparkles },
  { name: 'Passly', href: '/tools/passly', icon: Key },
  { name: 'Summary Smith', href: '/tools/summary-smith', icon: FileText },
] as const;

export default function Home() {
  const { isConfigured, isLoaded } = useTimesheetSettings();

  return (
    <MainLayout>
      <div className='container mx-auto px-4 py-12'>
        <div className='max-w-5xl mx-auto space-y-12'>
          {/* Hero */}
          <div className='space-y-3'>
            <h1 className='text-4xl font-bold tracking-tight'>
              Welcome to Eleven Systems
            </h1>
            <p className='text-lg text-muted-foreground max-w-2xl'>
              Log your Jira timesheets, track worklogs, and access a suite of
              developer tools — all in one place.
            </p>
          </div>

          {/* Timesheet — Main Feature */}
          <section className='space-y-5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2.5'>
                <Clock className='h-5 w-5 text-primary' />
                <h2 className='text-xl font-semibold'>Timesheet</h2>
                {isLoaded && isConfigured && (
                  <Badge variant='secondary' className='gap-1.5 ml-1'>
                    <span className='h-2 w-2 rounded-full bg-green-500' />
                    Connected
                  </Badge>
                )}
              </div>
              <Button variant='ghost' size='sm' asChild>
                <Link href='/timesheet'>
                  View all
                  <ArrowRight className='h-4 w-4' />
                </Link>
              </Button>
            </div>

            {isLoaded && !isConfigured && (
              <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-200'>
                <p>
                  <strong>Getting started:</strong> Head to{' '}
                  <Link
                    href='/timesheet/config'
                    className='font-medium underline underline-offset-4'
                  >
                    Settings
                  </Link>{' '}
                  to configure your Jira credentials before logging work.
                </p>
              </div>
            )}

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {timesheetActions.map(action => (
                <Link key={action.href} href={action.href} className='group'>
                  <Card
                    className={`relative h-full overflow-hidden transition-all group-hover:shadow-md ${
                      action.primary
                        ? 'bg-primary/[0.03] dark:bg-primary/[0.06]'
                        : ''
                    }`}
                  >
                    {action.primary && (
                      <ShineBorder
                        shineColor={['#38bdf8', '#8b5cf6', '#f472b6']}
                        borderWidth={1.5}
                        duration={10}
                      />
                    )}
                    <CardHeader className='pb-2'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            action.primary
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          <action.icon className='h-5 w-5' />
                        </div>
                        <CardTitle className='text-base'>
                          {action.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{action.description}</CardDescription>
                    </CardContent>
                    {action.primary && (
                      <CardFooter>
                        <Button className='w-full' size='sm'>
                          Log timesheet
                          <ArrowRight className='h-4 w-4' />
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <Separator />

          {/* Quick Tools */}
          <section className='space-y-5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2.5'>
                <Wrench className='h-5 w-5 text-muted-foreground' />
                <h2 className='text-xl font-semibold'>Quick Tools</h2>
              </div>
              <Button variant='ghost' size='sm' asChild>
                <Link href='/tools'>
                  View all tools
                  <ArrowRight className='h-4 w-4' />
                </Link>
              </Button>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
              {quickTools.map(tool => {
                const Icon = tool.icon;
                return (
                  <Link key={tool.href} href={tool.href}>
                    <Card className='h-full text-center hover:shadow-md transition-all cursor-pointer py-5'>
                      <CardContent className='flex flex-col items-center gap-2 p-0'>
                        <Icon className='h-6 w-6 text-primary' />
                        <span className='text-sm font-medium'>{tool.name}</span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
