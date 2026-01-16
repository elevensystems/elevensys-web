'use client';

import Link from 'next/link';

import { Braces, FileText, Key, Link2, Package, Wrench } from 'lucide-react';

import { MainLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const tools = [
  {
    title: 'URL Shortener',
    description: 'Shorten long URLs to make them easier to share and manage',
    href: '/tools/url-shortener',
    icon: Link2,
  },
  {
    title: 'Password Generator',
    description: 'Generate secure, random passwords with customizable options',
    href: '/tools/password-generator',
    icon: Key,
  },
  {
    title: 'NPM Converter',
    description: 'Convert Lerna publish output to npm install commands',
    href: '/tools/npm-converter',
    icon: Package,
  },
  {
    title: 'PR Link Shrinker',
    description: 'Shorten GitHub PR URLs to a compact, readable format',
    href: '/tools/pr-link-shrinker',
    icon: Link2,
  },
  {
    title: 'Summary Smith',
    description: 'Generate formatted status summaries for Rally stories',
    href: '/tools/summary-smith',
    icon: FileText,
  },
  {
    title: 'Prompt Templates',
    description: 'Browse and copy prompt templates for AI agents and workflows',
    href: '/tools/prompt-templates',
    icon: FileText,
  },
  {
    title: 'JSON Diffinity',
    description: 'Compare two JSON payloads with editor-style highlighting',
    href: '/tools/json-diffinity',
    icon: Braces,
  },
  // Add more tools here as they are created
];

export default function ToolsPage() {
  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto'>
          <div className='mb-12'>
            <div className='flex items-center gap-3 mb-4'>
              <Wrench className='h-8 w-8' />
              <h1 className='text-4xl font-semibold'>Tools</h1>
            </div>
            <p className='text-muted-foreground text-lg'>
              A collection of useful tools to help you be more productive
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {tools.map(tool => {
              const Icon = tool.icon;
              return (
                <Link key={tool.href} href={tool.href}>
                  <Card className='h-full hover:shadow-lg transition-shadow cursor-pointer'>
                    <CardHeader>
                      <div className='flex items-center gap-3 mb-2'>
                        <Icon className='h-6 w-6 text-primary' />
                        <CardTitle>{tool.title}</CardTitle>
                      </div>
                      <CardDescription>{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant='ghost' className='w-full' asChild>
                        <span>Open Tool →</span>
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
