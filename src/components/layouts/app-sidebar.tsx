'use client';

import * as React from 'react';

import Link from 'next/link';

import {
  Braces,
  Clock,
  Command,
  FileText,
  Home,
  Key,
  Languages,
  LifeBuoy,
  Link2,
  Link as LinkIcon,
  Music4,
  Package,
  ScrollText,
  Send,
  Sparkles,
} from 'lucide-react';

import { FeedbackModal } from '@/components/layouts/feedback-modal';
import { NavMain } from '@/components/layouts/nav-main';
import { NavSecondary } from '@/components/layouts/nav-secondary';
import { NavTools } from '@/components/layouts/nav-tools';
import { NavUser } from '@/components/layouts/nav-user';
import { SupportModal } from '@/components/layouts/support-modal';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { ToolConfig } from '@/lib/tools-config';
import type { AuthUser } from '@/types/auth';

/**
 * Sidebar navigation and tools configuration
 */
const data = {
  user: null as AuthUser | null,
  navMain: [
    {
      title: 'Home',
      url: '/',
      icon: Home,
    },
    {
      title: 'Timesheet',
      url: '/timesheet',
      icon: Clock,
      isActive: true,
      items: [
        {
          title: 'Log Work',
          url: '/timesheet/logwork',
        },
        {
          title: 'My Worklogs',
          url: '/timesheet/worklogs',
        },
        {
          title: 'Configs',
          url: '/timesheet/config',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Support',
      url: '#',
      icon: LifeBuoy,
      onClick: 'support',
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send,
      onClick: 'feedback',
    },
  ],
  tools: [
    {
      name: 'Urlify',
      url: '/tools/urlify',
      icon: LinkIcon,
    },
    {
      name: 'JSON Diffinity',
      url: '/tools/json-diffinity',
      icon: Braces,
    },
    {
      name: 'JSON Objectify',
      url: '/tools/json-objectify',
      icon: Sparkles,
    },
    {
      name: 'Translately',
      url: '/tools/translately',
      icon: Languages,
      isPro: true,
    },
    {
      name: 'NPM Converter',
      url: '/tools/npm-converter',
      icon: Package,
    },
    {
      name: 'Passly',
      url: '/tools/passly',
      icon: Key,
    },
    {
      name: 'PR Link Shrinker',
      url: '/tools/pr-link-shrinker',
      icon: Link2,
    },
    {
      name: 'Summary Smith',
      url: '/tools/summary-smith',
      icon: FileText,
    },
    {
      name: 'Prompt Templates',
      url: '/tools/prompt-templates',
      icon: ScrollText,
      isPro: true,
    },
    {
      name: 'Beatly',
      url: '/tools/beatly',
      icon: Music4,
    },
  ] satisfies ToolConfig[],
};

const hasData = <T,>(data: T[] | undefined | null): boolean => {
  return Boolean(data && data.length > 0);
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: AuthUser | null;
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const [isSupportModalOpen, setIsSupportModalOpen] = React.useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = React.useState(false);
  const tools = data.tools;

  const handleNavAction = (action?: string) => {
    if (action === 'support') {
      setIsSupportModalOpen(true);
    } else if (action === 'feedback') {
      setIsFeedbackModalOpen(true);
    }
  };

  return (
    <>
      <Sidebar variant='floating' collapsible='icon' {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size='lg' asChild>
                <Link href='/'>
                  <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                    <Command className='size-4' />
                  </div>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium'>Eleven Systems</span>
                    <span className='truncate text-xs'>Trial</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {hasData(data.navMain) && <NavMain items={data.navMain} />}
          {hasData(tools) && <NavTools tools={tools} />}
          {hasData(data.navSecondary) && (
            <NavSecondary
              items={data.navSecondary}
              className='mt-auto'
              onItemClick={handleNavAction}
            />
          )}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      </Sidebar>
      <SupportModal
        open={isSupportModalOpen}
        onOpenChange={setIsSupportModalOpen}
      />
      <FeedbackModal
        open={isFeedbackModalOpen}
        onOpenChange={setIsFeedbackModalOpen}
      />
    </>
  );
}
